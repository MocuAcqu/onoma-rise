"""Audio transcription and chord-analysis routes."""
from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from tonnze.config import AUDIO_EXTENSIONS, AUDIO_MAX_BYTES
from tonnze.services.audio_analysis import AudioAnalysisService


router = APIRouter(prefix="/api/audio", tags=["audio"])
service = AudioAnalysisService()


@router.post("/transcribe")
def transcribe(file: UploadFile):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in AUDIO_EXTENSIONS:
        raise HTTPException(400, "請上傳 WAV、MP3、M4A、FLAC 或 OGG 音檔。")
    try:
        with tempfile.TemporaryDirectory(prefix="tonnze-audio-") as directory:
            source = Path(directory) / f"source{suffix}"
            size = 0
            with source.open("wb") as output:
                while chunk := file.file.read(1024 * 1024):
                    size += len(chunk)
                    if size > AUDIO_MAX_BYTES:
                        raise HTTPException(413, "音檔不可超過 100 MB。")
                    output.write(chunk)
            if not size:
                raise HTTPException(400, "音檔是空的，請重新選擇。")
            return service.analyze(str(source))
    except HTTPException:
        raise
    except Exception as error:
        import traceback
        traceback.print_exc() # <--- 印出完整錯誤堆疊
        print(f"真實音訊錯誤原因: {str(error)}")

        raise HTTPException(500, f"音訊辨識失敗：{error}") from error
    finally:
        file.file.close()
