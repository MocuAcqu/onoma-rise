"""Execute one RapidOCR pass in a short-lived process."""
from __future__ import annotations

import json
import sys
from pathlib import Path


# Direct script execution puts ``tonnze/recognition`` first on sys.path. Add
# python-backend explicitly so the package import below is stable everywhere.
SCRIPT_DIR = Path(__file__).resolve().parent
PYTHON_BACKEND = SCRIPT_DIR.parents[1]
if str(PYTHON_BACKEND) not in sys.path:
    sys.path.insert(0, str(PYTHON_BACKEND))

from tonnze.recognition.ocr import recognize  # noqa: E402


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: ocr_runner.py IMAGE RESULT_JSON")
    image = Path(sys.argv[1]).resolve()
    result = Path(sys.argv[2]).resolve()
    rows = recognize(image)
    result.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
