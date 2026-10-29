"""Local, fault-tolerant score pipeline: HOMR plus OCR and optional YOLO."""
from __future__ import annotations

import json
import logging
import shutil
import sys
import xml.etree.ElementTree as ET
from copy import deepcopy
from contextlib import closing
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image
from music21 import bar, converter, repeat

from tonnze.recognition import homr, ocr, yolo
from tonnze.rules.articulations import articulation_events
from tonnze.rules.marks import notation_marks
from tonnze.rules.measure_timing import normalize_measure_timing
from tonnze.rules.notation_layout import apply_notation_rules
from tonnze.rules.ornaments import ornament_events
from tonnze.rules.performance import performance_events
from tonnze.rules.xml_enricher import enrich_musicxml
from tonnze.config import (
    AUX_IMAGE_MAX_EDGE,
    ENABLE_OCR,
    ENABLE_YOLO,
    HOMR_BIN,
    HOMR_BATCH_SIZE,
    HOMR_IMAGE_WIDTH,
    HOMR_MEMORY_PATCH,
    HOMR_ONNX_THREADS,
    HOMR_TITLE_OCR,
    YOLO_CONFIDENCE,
    YOLO_WEIGHTS,
)

logger = logging.getLogger(__name__)
PUBLIC_SCORE_FAILURE = "辨識失敗，請換一份清晰的樂譜重試。"
PUBLIC_ENGINE_FAILURE = "輔助辨識暫時無法使用。"


def event(**data) -> None:
    message = "SCORE_EVENT " + json.dumps(data, ensure_ascii=False)
    # 強制將輸出編碼為 UTF-8，防止 Windows 終端機/管道亂碼
    try:
        sys.stdout.buffer.write((message + "\n").encode("utf-8"))
        sys.stdout.buffer.flush()
    except Exception:
        print(message, flush=True)

def _scaled_size(size: tuple[int, int], target_long_edge: int) -> tuple[int, int]:
    """Preserve aspect ratio while selecting one final allocation size."""
    width, height = size
    scale = target_long_edge / max(width, height)
    return max(1, round(width * scale)), max(1, round(height * scale))


def _width_size(size: tuple[int, int], target_width: int) -> tuple[int, int]:
    width, height = size
    scale = target_width / width
    return target_width, max(1, round(height * scale))


def _save_rgb_variant(image: Image.Image, target: Path, size: tuple[int, int]) -> None:
    """Resize once and avoid keeping redundant RGBA/RGB copies alive."""
    resized = image.resize(size, Image.Resampling.LANCZOS) if image.size != size else None
    working = resized or image
    try:
        has_alpha = working.mode in {"RGBA", "LA"} or (
            working.mode == "P" and "transparency" in working.info
        )
        if has_alpha:
            # Flatten transparency directly into the one RGB buffer HOMR/OCR need.
            with (
                working.convert("RGBA") as rgba,
                Image.new("RGB", working.size, "white") as rgb,
            ):
                with rgba.getchannel("A") as alpha:
                    rgb.paste(rgba, mask=alpha)
                rgb.save(target, dpi=(300, 300), optimize=True)
        elif working.mode == "RGB":
            # Do not call convert("RGB") here: it would allocate another full page.
            working.save(target, dpi=(300, 300), optimize=True)
        else:
            with working.convert("RGB") as rgb:
                rgb.save(target, dpi=(300, 300), optimize=True)
    finally:
        if resized is not None:
            resized.close()


def _prepare_raster_images(
    source: Path, homr_target: Path, auxiliary_target: Path
) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int], bool]:
    with Image.open(source) as original:
        original_size = original.size
        original_long_edge = max(original_size)
        # Preserve native pixels for small uploads. The old 2800 px minimum
        # enlarged this test page by over 5x in area without adding detail.
        auxiliary_long_edge = min(original_long_edge, AUX_IMAGE_MAX_EDGE)
        auxiliary_size = _scaled_size(original_size, auxiliary_long_edge)
        homr_size = _width_size(original_size, HOMR_IMAGE_WIDTH)

        # Save variants sequentially. Only one resized page is live at a time.
        _save_rgb_variant(original, auxiliary_target, auxiliary_size)
        _save_rgb_variant(original, homr_target, homr_size)
    return original_size, homr_size, auxiliary_size, auxiliary_long_edge > original_long_edge


def _prepare_pdf_images(
    source: Path, homr_target: Path, auxiliary_target: Path
) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int], bool]:
    with closing(pdfium.PdfDocument(source)) as document:
        if len(document) != 1:
            raise ValueError("目前只支援單頁 PDF。")
        with closing(document[0]) as page:
            page_width, page_height = page.get_size()

            # Render the two targets separately. This trades a little CPU for a
            # much lower peak than rendering one 3200 px page plus a 1920 px copy.
            auxiliary_scale = min(4, AUX_IMAGE_MAX_EDGE / max(page_width, page_height))
            with closing(page.render(scale=auxiliary_scale)) as bitmap:
                with bitmap.to_pil() as auxiliary:
                    auxiliary_size = auxiliary.size
                    _save_rgb_variant(auxiliary, auxiliary_target, auxiliary_size)
            # The old diagnostic reported the rendered PDF size, not PDF point
            # units. Preserve that meaning so low-resolution warnings stay valid.
            original_size = auxiliary_size

            homr_scale = min(4, HOMR_IMAGE_WIDTH / page_width)
            with closing(page.render(scale=homr_scale)) as bitmap:
                with bitmap.to_pil() as homr_image:
                    homr_size = homr_image.size
                    _save_rgb_variant(homr_image, homr_target, homr_size)
    return original_size, homr_size, auxiliary_size, False


def prepare_images(source: Path, homr_target: Path, auxiliary_target: Path) -> dict:
    """Create independent HOMR and auxiliary images with bounded live memory."""
    if source.suffix.lower() == ".pdf":
        original_size, homr_size, auxiliary_size, upscaled = _prepare_pdf_images(
            source, homr_target, auxiliary_target
        )
    else:
        original_size, homr_size, auxiliary_size, upscaled = _prepare_raster_images(
            source, homr_target, auxiliary_target
        )
    return {
        "original_size": list(original_size),
        # Existing enrichment logic maps OCR coordinates against score.png.
        "prepared_size": list(auxiliary_size),
        "homr_size": list(homr_size),
        "upscaled": upscaled,
    }


def _optional_engines(image: Path) -> dict:
    engines = {}
    ocr_rows = []
    yolo_result = None
    if ENABLE_YOLO:
        event(percent=18, stage="辨識延長記號與附點")
        try:
            yolo_result = yolo.recognize(image, YOLO_WEIGHTS, YOLO_CONFIDENCE)
            engines["yolo"] = {
                "status": "ok",
                "device": yolo_result["device"],
                "detections": len(yolo_result["detections"]),
            }
        except Exception:
            logger.exception("YOLO auxiliary recognition failed")
            engines["yolo"] = {
                "status": "unavailable",
                "detail": PUBLIC_ENGINE_FAILURE,
            }
    else:
        engines["yolo"] = {"status": "disabled"}

    if ENABLE_OCR:
        event(percent=30, stage="辨識音樂術語")
        try:
            # RapidOCR owns several ONNX sessions. Run it outside this process
            # so its native arenas are returned before MusicXML/MIDI creation.
            ocr_rows = ocr.recognize_isolated(image)
            engines["ocr"] = {"status": "ok", "lines": len(ocr_rows)}
        except Exception:
            logger.exception("OCR auxiliary recognition failed")
            engines["ocr"] = {
                "status": "unavailable",
                "detail": PUBLIC_ENGINE_FAILURE,
            }
    else:
        engines["ocr"] = {"status": "disabled"}
    return {"engines": engines, "ocr": ocr_rows, "yolo": yolo_result}


def _write_linear_midi(score, target: Path) -> None:
    """Write source-order MIDI; repeat playback is expanded by the frontend."""
    linear_score = deepcopy(score)
    for measure in linear_score.recurse().getElementsByClass("Measure"):
        if isinstance(measure.leftBarline, bar.Repeat):
            measure.leftBarline = bar.Barline("regular")
        if isinstance(measure.rightBarline, bar.Repeat):
            measure.rightBarline = bar.Barline("regular")
    for expression in list(
        linear_score.recurse().getElementsByClass(repeat.RepeatExpression)
    ):
        if expression.activeSite is not None:
            expression.activeSite.remove(expression)
    linear_score.write("midi", fp=target)


def _write_outputs(work: Path, homr_output: Path, auxiliary: dict, image_info: dict) -> dict:
    event(percent=82, stage="合併 MusicXML 與音樂術語")
    base = work / "base.musicxml"
    # Keep homr's original voices, staves, slur numbering and beam structure for
    # notation rendering. A music21 write round-trip is intentionally avoided:
    # it renumbers slurs and can drop one side of malformed pairs. music21 still
    # parses the repaired result below to validate it and create the MIDI file.
    shutil.copyfile(homr_output, base)
    timing_rules = normalize_measure_timing(base)
    notation_rules = apply_notation_rules(base)
    notation_rules["measure_timing"] = timing_rules
    terms = enrich_musicxml(
        base,
        work / "result.musicxml",
        auxiliary["ocr"],
        image_info["prepared_size"][1],
        image_info["prepared_size"][0],
        score_image=work / "score.png",
    )
    score = converter.parse(work / "result.musicxml")
    count = sum(len(item.pitches) for item in score.flatten().notes)
    if not count:
        raise ValueError("沒有辨識到音符，請使用清晰的印刷五線譜。")
    event(percent=92, stage="產生 MIDI")
    _write_linear_midi(score, work / "result.mid")
    tempos = score.metronomeMarkBoundaries()
    bpm = float(tempos[0][2].getQuarterBPM()) if tempos else 120.0
    warnings = []
    xml_root = ET.parse(work / "result.musicxml").getroot()
    declared_staves = [
        int(element.text) for element in xml_root.iter()
        if element.tag.rsplit("}", 1)[-1] == "staves" and (element.text or "").isdigit()
    ]
    piano = {
        "part_count": len(score.parts),
        "staff_count": max(declared_staves, default=1),
        "grand_staff": max(declared_staves, default=1) >= 2 or len(score.parts) >= 2,
        "measure_count": max((len(part.getElementsByClass("Measure")) for part in score.parts), default=0),
    }
    if not piano["grand_staff"]:
        warnings.append("未確認到鋼琴雙譜表；請檢查 MusicXML 的左右手是否完整。")
    if min(image_info["original_size"]) < 900:
        warnings.append("原圖解析度偏低；請改用較清晰原圖，單純放大無法補回遺失的符號細節。")
    for name, status in auxiliary["engines"].items():
        if status["status"] == "unavailable":
            warnings.append(f"{name} 輔助辨識未啟用：{status['detail']}")
    if auxiliary["yolo"] and auxiliary["yolo"]["detections"]:
        warnings.append("YOLO 結果目前作為候選提示，尚未直接覆寫音符，避免真實掃描譜誤判。")
    diagnostics = {
        "image": image_info,
        "engines": {"homr": {"status": "ok"}, **auxiliary["engines"]},
        "ocr": auxiliary["ocr"],
        "yolo": auxiliary["yolo"],
        "terms": terms,
        "piano": piano,
        "notation_rules": notation_rules,
        "warnings": warnings,
    }
    (work / "diagnostics.json").write_text(
        json.dumps(diagnostics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    metadata = {
        "note_count": count,
        "bpm": bpm,
        "engines": diagnostics["engines"],
        "terms": terms,
        "piano": piano,
        "warnings": warnings,
        "notation": {
            "articulations": articulation_events(score),
            "marks": notation_marks(score),
            "ornaments": ornament_events(work / "result.musicxml"),
            "performance": performance_events(score, terms),
        },
    }
    (work / "result.json").write_text(
        json.dumps(metadata, ensure_ascii=False), encoding="utf-8"
    )
    return metadata


class ScoreRecognitionService:
    """Coordinate one score job while engine adapters stay independently testable."""

    def run(self, work: Path) -> None:
        sources = list(work.glob("source.*"))
        if len(sources) != 1:
            raise ValueError("找不到原始樂譜。")
        event(percent=3, stage="準備樂譜圖片")
        auxiliary_image = work / "score.png"
        homr_image = work / "homr-page.png"
        image_info = prepare_images(sources[0], homr_image, auxiliary_image)

        # Run the heavy engines sequentially so their ONNX sessions and image
        # tensors never contribute to the same process-tree memory peak.
        event(percent=8, stage="啟動 HOMR 音符辨識")
        homr_output = homr.recognize(
            homr_image,
            work,
            HOMR_BIN,
            memory_optimized=HOMR_MEMORY_PATCH,
            batch_size=HOMR_BATCH_SIZE,
            onnx_threads=HOMR_ONNX_THREADS,
            title_ocr=HOMR_TITLE_OCR,
        )
        event(percent=72, stage="HOMR 音符辨識完成")
        auxiliary = _optional_engines(auxiliary_image)
        _write_outputs(work, homr_output, auxiliary, image_info)
        event(percent=99, stage="儲存辨識結果")


def recognize(work: Path) -> None:
    ScoreRecognitionService().run(work)


if __name__ == "__main__":
    try:
        recognize(Path(sys.argv[1]))
    except Exception:
        logger.exception("Score recognition failed")
        event(error=PUBLIC_SCORE_FAILURE)
        raise SystemExit(1)
