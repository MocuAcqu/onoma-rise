"""Local, fault-tolerant score pipeline: HOMR plus OCR and optional YOLO."""
from __future__ import annotations

import json
import shutil
import sys
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image
from music21 import converter

from tonnze.recognition import homr, ocr, yolo
from tonnze.rules.articulations import articulation_events
from tonnze.rules.marks import notation_marks
from tonnze.rules.notation_layout import apply_notation_rules
from tonnze.rules.ornaments import ornament_events
from tonnze.rules.performance import performance_events
from tonnze.rules.xml_enricher import enrich_musicxml
from tonnze.config import (
    ENABLE_OCR,
    ENABLE_YOLO,
    HOMR_BIN,
    MAX_IMAGE_EDGE,
    MIN_PNG_LONG_EDGE,
    YOLO_CONFIDENCE,
    YOLO_WEIGHTS,
)


def event(**data) -> None:
    message = "SCORE_EVENT " + json.dumps(data, ensure_ascii=False)
    # 強制將輸出編碼為 UTF-8，防止 Windows 終端機/管道亂碼
    try:
        sys.stdout.buffer.write((message + "\n").encode("utf-8"))
        sys.stdout.buffer.flush()
    except Exception:
        print(message, flush=True)

def prepare_image(source: Path, target: Path) -> dict:
    is_pdf = source.suffix.lower() == ".pdf"
    if is_pdf:
        with closing(pdfium.PdfDocument(source)) as document:
            if len(document) != 1:
                raise ValueError("目前只支援單頁 PDF。")
            with closing(document[0]) as page:
                scale = min(4, MAX_IMAGE_EDGE / max(page.get_size()))
                with closing(page.render(scale=scale)) as bitmap:
                    image = bitmap.to_pil().copy()
    else:
        with Image.open(source) as original:
            image = original.convert("RGBA")
    original_size = image.size
    upscaled = False
    if not is_pdf and max(image.size) < MIN_PNG_LONG_EDGE:
        scale = MIN_PNG_LONG_EDGE / max(image.size)
        image = image.resize(
            (round(image.width * scale), round(image.height * scale)),
            Image.Resampling.LANCZOS,
        )
        upscaled = True
    image.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        image = background
    image.convert("RGB").save(target, dpi=(300, 300), optimize=True)
    return {
        "original_size": list(original_size),
        "prepared_size": list(image.size),
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
        except Exception as error:
            engines["yolo"] = {"status": "unavailable", "detail": str(error)}
    else:
        engines["yolo"] = {"status": "disabled"}

    if ENABLE_OCR:
        event(percent=30, stage="辨識音樂術語")
        try:
            ocr_rows = ocr.recognize(image)
            engines["ocr"] = {"status": "ok", "lines": len(ocr_rows)}
        except Exception as error:
            engines["ocr"] = {"status": "unavailable", "detail": str(error)}
    else:
        engines["ocr"] = {"status": "disabled"}
    return {"engines": engines, "ocr": ocr_rows, "yolo": yolo_result}


def _write_outputs(work: Path, homr_output: Path, auxiliary: dict, image_info: dict) -> dict:
    event(percent=82, stage="合併 MusicXML 與音樂術語")
    base = work / "base.musicxml"
    # Keep homr's original voices, staves, slur numbering and beam structure for
    # notation rendering. A music21 write round-trip is intentionally avoided:
    # it renumbers slurs and can drop one side of malformed pairs. music21 still
    # parses the repaired result below to validate it and create the MIDI file.
    shutil.copyfile(homr_output, base)
    notation_rules = apply_notation_rules(base)
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
    score.write("midi", fp=work / "result.mid")
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
    if image_info["upscaled"] and min(image_info["original_size"]) < 900:
        warnings.append("原圖解析度偏低；放大可改善幾何辨識，但無法補回遺失的符號細節。")
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
        image = work / "score.png"
        image_info = prepare_image(sources[0], image)
        event(percent=8, stage="啟動 HOMR 與輔助辨識")
        # HOMR is normally the slow branch. OCR/YOLO share the other branch so
        # image work overlaps without loading all engines at the same instant.
        with ThreadPoolExecutor(max_workers=2, thread_name_prefix="score-engine") as pool:
            homr_future = pool.submit(homr.recognize, image, work, HOMR_BIN)
            auxiliary_future = pool.submit(_optional_engines, image)
            homr_output = homr_future.result()
            event(percent=72, stage="HOMR 音符辨識完成")
            auxiliary = auxiliary_future.result()
        _write_outputs(work, homr_output, auxiliary, image_info)
        event(percent=99, stage="儲存辨識結果")


def recognize(work: Path) -> None:
    ScoreRecognitionService().run(work)


if __name__ == "__main__":
    try:
        recognize(Path(sys.argv[1]))
    except Exception as error:
        event(error=str(error))
        raise SystemExit(1)
