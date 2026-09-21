"""Runtime configuration shared by audio and score analysis."""
from __future__ import annotations

import os
import importlib.util
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[2]
# Artifact storage is deliberately left on the current data directory until
# the deployment storage decision (local / MongoDB GridFS) is made.
DATA = Path(os.getenv("SCORE_DATA_DIR", PROJECT / "score-recognition" / "data")).resolve()
DATABASE = Path(os.getenv("SCORE_DB_PATH", DATA / "jobs.sqlite3")).resolve()
HOMR_BIN = os.getenv("HOMR_BIN", str(Path(sys.executable).with_name("homr")))
YOLO_WEIGHTS = Path(
    os.getenv("YOLO_WEIGHTS", PROJECT / "models" / "fermata-augmentation-dot.pt")
).resolve()

MAX_BYTES = 20 * 1024 * 1024
MAX_IMAGE_EDGE = 4000
MIN_PNG_LONG_EDGE = 3200
MAX_QUEUE = int(os.getenv("SCORE_MAX_QUEUE", "20"))
JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT_SECONDS", "600"))
RETENTION = int(os.getenv("RETENTION_SECONDS", "86400"))
WORKER_STALE_SECONDS = 15
TERMINAL = {"complete", "failed", "cancelled"}
AUDIO_MAX_BYTES = 100 * 1024 * 1024
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}

# Auxiliary engines may fail without invalidating homr's note recognition.
ENABLE_OCR = os.getenv("SCORE_ENABLE_OCR", "1") != "0"
ENABLE_YOLO = os.getenv(
    "SCORE_ENABLE_YOLO",
    "1" if importlib.util.find_spec("ultralytics") and YOLO_WEIGHTS.is_file() else "0",
) != "0"
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.65"))
