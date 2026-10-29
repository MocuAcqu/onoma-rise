"""Regression tests for errors exposed by public recognition APIs."""
from io import BytesIO

import pytest
from fastapi import HTTPException, UploadFile

from tonnze.api import audio
from tonnze.services import score_recognition


def test_audio_error_does_not_expose_internal_exception(monkeypatch):
    secret = "/private/server/model.bin"

    def fail(_source):
        raise RuntimeError(secret)

    monkeypatch.setattr(audio.service, "analyze", fail)
    upload = UploadFile(filename="sample.wav", file=BytesIO(b"RIFF"))

    with pytest.raises(HTTPException) as caught:
        audio.transcribe(upload)

    assert caught.value.status_code == 500
    assert caught.value.detail == audio.PUBLIC_AUDIO_FAILURE
    assert secret not in caught.value.detail


def test_optional_engine_error_uses_safe_public_detail(monkeypatch, tmp_path):
    secret = "/private/server/yolo-weights.pt"

    def fail(*_args):
        raise RuntimeError(secret)

    monkeypatch.setattr(score_recognition, "ENABLE_YOLO", True)
    monkeypatch.setattr(score_recognition, "ENABLE_OCR", False)
    monkeypatch.setattr(score_recognition.yolo, "recognize", fail)

    result = score_recognition._optional_engines(tmp_path / "score.png")
    detail = result["engines"]["yolo"]["detail"]

    assert detail == score_recognition.PUBLIC_ENGINE_FAILURE
    assert secret not in detail
