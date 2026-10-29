"""Runtime configuration shared by audio and score analysis."""
from __future__ import annotations

import os
import importlib.util
import sys
from pathlib import Path

from tonnze.env_file import load_env_file

PROJECT = Path(__file__).resolve().parents[1]
load_env_file(PROJECT / ".env")
DATA = Path(os.getenv("SCORE_DATA_DIR", PROJECT / "runtime" / "recognition")).resolve()
DATABASE = Path(os.getenv("SCORE_DB_PATH", DATA / "jobs.sqlite3")).resolve()
SCORE_STORAGE_BACKEND = os.getenv("SCORE_STORAGE_BACKEND", "filesystem").strip().lower()
MONGO_URI = os.getenv("MONGO_URI", "").strip()
MONGO_DATABASE = os.getenv("MONGO_DATABASE", "").strip()
MONGO_JOBS_COLLECTION = os.getenv(
    "SCORE_MONGO_JOBS_COLLECTION", "recognition_jobs"
).strip()
MONGO_RUNTIME_COLLECTION = os.getenv(
    "SCORE_MONGO_RUNTIME_COLLECTION", "recognition_runtime"
).strip()
MONGO_GRIDFS_BUCKET = os.getenv(
    "SCORE_MONGO_GRIDFS_BUCKET", "recognition_files"
).strip()
if SCORE_STORAGE_BACKEND not in {"filesystem", "mongodb"}:
    raise ValueError("SCORE_STORAGE_BACKEND 必須是 filesystem 或 mongodb")
if SCORE_STORAGE_BACKEND == "mongodb" and not MONGO_URI:
    raise RuntimeError("SCORE_STORAGE_BACKEND=mongodb 時必須設定 MONGO_URI")
if SCORE_STORAGE_BACKEND == "mongodb" and not MONGO_DATABASE:
    raise RuntimeError("SCORE_STORAGE_BACKEND=mongodb 時必須設定 MONGO_DATABASE")
if not all((MONGO_JOBS_COLLECTION, MONGO_RUNTIME_COLLECTION, MONGO_GRIDFS_BUCKET)):
    raise ValueError("MongoDB collection 與 GridFS bucket 名稱不可為空")
HOMR_BIN = os.getenv("HOMR_BIN") or str(Path(sys.executable).with_name("homr"))
YOLO_WEIGHTS = Path(
    os.getenv("YOLO_WEIGHTS", PROJECT / "models" / "fermata-augmentation-dot.pt")
).resolve()

MAX_BYTES = 20 * 1024 * 1024
# HOMR 0.7 normalizes every page to this width internally. Preparing the same
# width here avoids decoding a 3200-4000 px intermediate image in its process.
HOMR_IMAGE_WIDTH = int(os.getenv("SCORE_HOMR_IMAGE_WIDTH", "1920"))

# OCR and YOLO keep a separate image so their pixels are never resident with
# HOMR. Raster uploads are capped, but never enlarged: interpolation cannot
# restore missing score detail and it increases inference activations.
AUX_IMAGE_MAX_EDGE = int(os.getenv("SCORE_AUX_IMAGE_MAX_EDGE", "3200"))
HOMR_BATCH_SIZE = int(os.getenv("SCORE_HOMR_BATCH_SIZE", "2"))
# Two threads were the measured sweet spot: one was slower without reducing
# peak RSS, while the ONNX host-sized default duplicated large worker pools.
HOMR_ONNX_THREADS = int(os.getenv("SCORE_HOMR_ONNX_THREADS", "2"))
HOMR_TITLE_OCR = os.getenv("SCORE_HOMR_TITLE_OCR", "0") == "1"
if min(HOMR_IMAGE_WIDTH, AUX_IMAGE_MAX_EDGE) <= 0:
    raise ValueError("樂譜圖片尺寸設定必須大於 0")
if min(HOMR_BATCH_SIZE, HOMR_ONNX_THREADS) <= 0:
    raise ValueError("SCORE_HOMR_BATCH_SIZE 與 SCORE_HOMR_ONNX_THREADS 必須大於 0")

# The runner installs the project-owned streaming tile implementation before
# HOMR starts. Set to 0 only when using an incompatible custom HOMR executable.
HOMR_MEMORY_PATCH = os.getenv("SCORE_HOMR_MEMORY_PATCH", "1") != "0"
MAX_QUEUE = int(os.getenv("SCORE_MAX_QUEUE", "20"))
JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT_SECONDS", "600"))
RETENTION = int(os.getenv("RETENTION_SECONDS", "86400"))
WORKER_STALE_SECONDS = 15
TERMINAL = {"complete", "failed", "cancelled"}
AUDIO_MAX_BYTES = 100 * 1024 * 1024
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}
RECOGNITION_PROXY_TOKEN = os.getenv("RECOGNITION_PROXY_TOKEN", "").strip()
RECOGNITION_REQUIRE_PROXY_TOKEN = os.getenv(
    "RECOGNITION_REQUIRE_PROXY_TOKEN", "0"
) == "1"
if RECOGNITION_REQUIRE_PROXY_TOKEN and len(RECOGNITION_PROXY_TOKEN) < 32:
    raise RuntimeError(
        "正式環境必須設定至少 32 字元的 RECOGNITION_PROXY_TOKEN"
    )

# Auxiliary engines may fail without invalidating homr's note recognition.
ENABLE_OCR = os.getenv("SCORE_ENABLE_OCR", "1") != "0"
ENABLE_YOLO = os.getenv(
    "SCORE_ENABLE_YOLO",
    "1" if importlib.util.find_spec("ultralytics") and YOLO_WEIGHTS.is_file() else "0",
) != "0"
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.65"))
