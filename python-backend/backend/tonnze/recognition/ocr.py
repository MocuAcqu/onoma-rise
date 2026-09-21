"""RapidOCR adapter; model and API differences stay isolated here."""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image


_MUSIC_TEXT = re.compile(
    r"\b(?:grave|largo|lento|adagio|andante|moderato|allegretto|allegro|"
    r"vivace|presto|prestissimo|brightly|tempo|rit|rall|accel|cresc|dim|"
    r"decresc|dolce|legato|cantabile|espressivo|marcato|trio|coda|"
    r"ppp|pp|mp|mf|fff|ff|p|f)\b",
    re.IGNORECASE,
)


def _box(value) -> list[list[float]]:
    return [[float(point[0]), float(point[1])] for point in value]


def _modern_output(result) -> list[dict]:
    boxes = getattr(result, "boxes", None)
    texts = getattr(result, "txts", None)
    scores = getattr(result, "scores", None)
    if boxes is None and isinstance(result, dict):
        boxes, texts, scores = result.get("boxes"), result.get("txts"), result.get("scores")
    if boxes is None or texts is None:
        return []
    scores = scores if scores is not None else [1.0] * len(texts)
    return [
        {"text": str(text), "confidence": float(score), "box": _box(box)}
        for box, text, score in zip(boxes, texts, scores)
    ]


def _legacy_output(result) -> list[dict]:
    # Older PP-OCR/RapidOCR versions return (box, text, score) rows, sometimes
    # wrapped in a (rows, elapsed) tuple or a one-page list.
    value = result
    if isinstance(value, tuple) and value:
        value = value[0]
    if isinstance(value, list) and len(value) == 1 and isinstance(value[0], list):
        value = value[0]
    rows = []
    for item in value or []:
        if not isinstance(item, (list, tuple)) or len(item) < 3:
            continue
        box, text, score = item[:3]
        if isinstance(text, (list, tuple)):
            text, score = text[0], text[1]
        rows.append({"text": str(text), "confidence": float(score), "box": _box(box)})
    return rows


def _rows(result) -> list[dict]:
    return _modern_output(result) or _legacy_output(result)


def _offset(rows: list[dict], left: int, top: int) -> list[dict]:
    for row in rows:
        row["box"] = [
            [point[0] + left, point[1] + top]
            for point in row["box"]
        ]
    return rows


def _bounds(box) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def _overlap(first, second) -> float:
    ax1, ay1, ax2, ay2 = _bounds(first)
    bx1, by1, bx2, by2 = _bounds(second)
    intersection = max(0, min(ax2, bx2) - max(ax1, bx1)) * max(
        0, min(ay2, by2) - max(ay1, by1)
    )
    smaller = min(max(1, (ax2 - ax1) * (ay2 - ay1)), max(1, (bx2 - bx1) * (by2 - by1)))
    return intersection / smaller


def _deduplicate(rows: list[dict]) -> list[dict]:
    kept: list[dict] = []
    for row in sorted(rows, key=lambda item: item["confidence"], reverse=True):
        normalized = re.sub(r"\W", "", row["text"]).lower()
        duplicate = next(
            (
                item for item in kept
                if re.sub(r"\W", "", item["text"]).lower() == normalized
                and _overlap(item["box"], row["box"]) >= 0.45
            ),
            None,
        )
        if duplicate is None:
            kept.append(row)
    return sorted(kept, key=lambda item: (_bounds(item["box"])[1], _bounds(item["box"])[0]))


def _needs_detail_pass(rows: list[dict]) -> bool:
    # Sparse classical pages are exactly where a full-page detector tends to
    # miss tiny one- or two-letter dynamics. Only pay for tiled OCR when the
    # first pass is sparse or contains no performance direction at all.
    return len(rows) < 16 or not any(_MUSIC_TEXT.search(row["text"]) for row in rows)


def recognize(image: Path) -> list[dict]:
    from rapidocr import RapidOCR

    engine = RapidOCR()
    rows = _rows(engine(str(image)))
    if _needs_detail_pass(rows):
        import numpy as np

        with Image.open(image) as source:
            rgb = source.convert("RGB")
            # Overlapping half-page columns and horizontal bands avoid the
            # detector shrinking a full piano page to its internal max edge.
            # This is especially important for isolated `p` / `f` marks.
            band_height = round(rgb.height * 0.34)
            step = max(1, round((rgb.height - band_height) / 3))
            tile_width = round(rgb.width * 0.56)
            lefts = (0, rgb.width - tile_width)
            for index in range(4):
                top = min(rgb.height - band_height, index * step)
                for left in lefts:
                    crop = np.asarray(
                        rgb.crop((left, top, left + tile_width, top + band_height))
                    )
                    rows.extend(_offset(_rows(engine(crop)), left, top))
    filtered = [
        row for row in rows
        if row["confidence"] >= 0.35 and row["text"].strip()
    ]
    return _deduplicate(filtered)
