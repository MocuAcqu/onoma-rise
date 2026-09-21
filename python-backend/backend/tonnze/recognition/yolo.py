"""Tiled inference for the fermata and augmentation-dot detector."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

NAMES = {0: "fermata", 1: "augmentation_dot"}


def _starts(length: int, size: int = 640, stride: int = 480) -> list[int]:
    last = max(0, length - size)
    return sorted(set(range(0, last + 1, stride)) | {last})


def _iou(a, b) -> float:
    left, top = max(a[0], b[0]), max(a[1], b[1])
    right, bottom = min(a[2], b[2]), min(a[3], b[3])
    intersection = max(0, right - left) * max(0, bottom - top)
    area = lambda box: (box[2] - box[0]) * (box[3] - box[1])
    union = area(a) + area(b) - intersection
    return intersection / union if union else 0.0


def _nms(detections: list[dict], threshold: float = 0.5) -> list[dict]:
    kept = []
    for item in sorted(detections, key=lambda row: row["confidence"], reverse=True):
        if not any(
            item["class_id"] == other["class_id"]
            and _iou(item["box_xyxy"], other["box_xyxy"]) > threshold
            for other in kept
        ):
            kept.append(item)
    return kept


def _device() -> str:
    import torch

    return "mps" if torch.backends.mps.is_available() else "cpu"


def recognize(image: Path, weights: Path, confidence: float) -> dict:
    if not weights.is_file():
        raise FileNotFoundError(f"找不到 YOLO 權重：{weights}")
    from ultralytics import YOLO

    model = YOLO(str(weights), task="detect")
    model_names = {int(key): value for key, value in dict(model.names).items()}
    if model_names != NAMES:
        raise ValueError(f"YOLO 類別不符：{model_names}")
    with Image.open(image) as opened:
        page = ImageOps.exif_transpose(opened).convert("L")
    width, height = page.size
    detections = []
    device = _device()
    for y in _starts(height):
        for x in _starts(width):
            tile = Image.new("RGB", (640, 640), "white")
            tile.paste(page.crop((x, y, min(x + 640, width), min(y + 640, height))), (0, 0))
            result = model.predict(
                tile, imgsz=640, device=device, conf=confidence, verbose=False
            )[0]
            for box, class_id, score in zip(
                result.boxes.xyxy.cpu().tolist(),
                result.boxes.cls.cpu().tolist(),
                result.boxes.conf.cpu().tolist(),
            ):
                left, top, right, bottom = box
                mapped = [
                    max(0.0, left + x), max(0.0, top + y),
                    min(float(width), right + x), min(float(height), bottom + y),
                ]
                if mapped[2] > mapped[0] and mapped[3] > mapped[1]:
                    class_id = int(class_id)
                    detections.append(
                        {
                            "class_id": class_id,
                            "class": NAMES[class_id],
                            "confidence": float(score),
                            "box_xyxy": mapped,
                        }
                    )
    return {
        "width": width,
        "height": height,
        "device": device,
        "detections": _nms(detections),
    }
