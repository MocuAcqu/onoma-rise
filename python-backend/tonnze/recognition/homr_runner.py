"""Start HOMR after installing the project-owned memory optimization."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path


# This file is launched directly while cwd points at the per-job HOMR folder.
# Python otherwise puts this script's directory first, where our adapter
# ``homr.py`` would shadow the third-party ``homr`` package. Remove that entry
# and add python-backend so both package families resolve unambiguously.
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path = [
    entry
    for entry in sys.path
    if not entry or Path(entry).resolve() != SCRIPT_DIR
]
PYTHON_BACKEND = SCRIPT_DIR.parents[1]
if str(PYTHON_BACKEND) not in sys.path:
    sys.path.insert(0, str(PYTHON_BACKEND))

from tonnze.recognition.homr_memory import install  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run HOMR optical music recognition with bounded memory."
    )
    parser.add_argument("image", type=Path)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument(
        "--onnx-threads",
        type=int,
        default=2,
        help="Maximum intra-op threads used by each HOMR ONNX model.",
    )
    parser.add_argument(
        "--title-ocr",
        action="store_true",
        help="Enable HOMR's concurrent title OCR (disabled by default).",
    )
    args = parser.parse_args()
    if args.batch_size <= 0:
        parser.error("--batch-size must be greater than zero")
    if args.onnx_threads <= 0:
        parser.error("--onnx-threads must be greater than zero")

    install(
        maximum_batch_size=args.batch_size,
        enable_title_ocr=args.title_ocr,
        onnx_threads=args.onnx_threads,
    )
    # Import after install(): homr.main will then call the patched inference
    # through its normal extract pipeline without changing the OMR model.
    from homr.main import main as homr_main

    # Keep project-owned flags out of HOMR's own argument parser.
    sys.argv = ["homr", str(args.image)]
    homr_main()


if __name__ == "__main__":
    main()
