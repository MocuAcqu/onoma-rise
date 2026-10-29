"""Unified FastAPI application for audio, chord and score recognition."""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tonnze.api import audio, scores
from tonnze.config import ENABLE_OCR, ENABLE_YOLO, RECOGNITION_PROXY_TOKEN
from tonnze.proxy_auth import ProxyTokenMiddleware
from tonnze.repositories import jobs


app = FastAPI(title="Tonnze Recognition", version="3.0.0")
app.add_middleware(ProxyTokenMiddleware, token=RECOGNITION_PROXY_TOKEN)
origins = [item.strip() for item in os.getenv(
    "TONNZE_CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
).split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Recognition-Token"],
)
app.include_router(audio.router)
app.include_router(scores.router)


@app.get("/api/health/recognition")
def health():
    engines = ["Basic Pitch", "HOMR"]
    if ENABLE_OCR:
        engines.append("RapidOCR")
    if ENABLE_YOLO:
        engines.append("YOLO")
    return {
        "api": True,
        "worker": jobs.worker_alive(scores.db),
        "engines": engines,
        "features": {
            "audio": True,
            "chords": True,
            "score": True,
            "ocr": ENABLE_OCR,
            "yolo": ENABLE_YOLO,
        },
    }
