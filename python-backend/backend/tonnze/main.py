"""Unified FastAPI application for audio, chord and score recognition."""
from __future__ import annotations

import sys
import codecs
import builtins

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    except Exception:
        pass

if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass

old_open = builtins.open
def utf8_open(*args, **kwargs):
    mode = kwargs.get('mode', 'r')
    if len(args) > 1:
        mode = args[1]
    
    if 'b' not in mode:
        if 'encoding' not in kwargs:
            kwargs['encoding'] = 'utf-8'
            
    return old_open(*args, **kwargs)

builtins.open = utf8_open

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from tonnze.api import audio, scores
from tonnze.config import ENABLE_OCR, ENABLE_YOLO
from tonnze.repositories import jobs


app = FastAPI(title="Tonnze Recognition", version="3.0.0")
origins = [item.strip() for item in os.getenv(
    "TONNZE_CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173"
).split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(audio.router)
app.include_router(scores.router)


@app.get("/api/health")
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
