"""Regression coverage for the score-recognition memory reductions."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys

import numpy as np
from PIL import Image

from tonnze.services import score_recognition


def test_prepare_images_creates_separate_bounded_variants(monkeypatch, tmp_path):
    source = tmp_path / "source.png"
    # Include alpha so the test also covers the single RGB-flattening path.
    Image.new("RGBA", (100, 200), (0, 0, 0, 128)).save(source)
    homr_target = tmp_path / "homr-page.png"
    auxiliary_target = tmp_path / "score.png"

    monkeypatch.setattr(score_recognition, "HOMR_IMAGE_WIDTH", 120)
    monkeypatch.setattr(score_recognition, "AUX_IMAGE_MAX_EDGE", 300)

    info = score_recognition.prepare_images(source, homr_target, auxiliary_target)

    with Image.open(homr_target) as homr_image:
        assert homr_image.size == (120, 240)
        assert homr_image.mode == "RGB"
    with Image.open(auxiliary_target) as auxiliary_image:
        assert auxiliary_image.size == (100, 200)
        assert auxiliary_image.mode == "RGB"
    assert info == {
        "original_size": [100, 200],
        "prepared_size": [100, 200],
        "homr_size": [120, 240],
        "upscaled": False,
    }


def test_service_runs_homr_before_auxiliary_engines(monkeypatch, tmp_path):
    (tmp_path / "source.png").write_bytes(b"source")
    calls: list[str] = []
    homr_output = tmp_path / "homr.musicxml"

    def prepare(_source: Path, homr_image: Path, auxiliary_image: Path) -> dict:
        homr_image.write_bytes(b"homr")
        auxiliary_image.write_bytes(b"aux")
        return {"prepared_size": [1, 1]}

    def recognize(*_args, **kwargs) -> Path:
        calls.append("homr")
        assert kwargs["onnx_threads"] == score_recognition.HOMR_ONNX_THREADS
        return homr_output

    def auxiliary(_image: Path) -> dict:
        calls.append("auxiliary")
        return {"engines": {}, "ocr": [], "yolo": None}

    monkeypatch.setattr(score_recognition, "prepare_images", prepare)
    monkeypatch.setattr(score_recognition.homr, "recognize", recognize)
    monkeypatch.setattr(score_recognition, "_optional_engines", auxiliary)
    monkeypatch.setattr(score_recognition, "_write_outputs", lambda *_args: calls.append("write"))

    score_recognition.ScoreRecognitionService().run(tmp_path)

    assert calls == ["homr", "auxiliary", "write"]


def test_streaming_homr_segmentation_returns_uint8_masks(monkeypatch):
    from homr.segmentation import inference_segnet
    from tonnze.recognition.homr_memory import memory_efficient_inference

    class FakeSegnet:
        def __init__(self, _use_gpu: bool) -> None:
            pass

        def run(self, batch: np.ndarray) -> np.ndarray:
            output = np.zeros((len(batch), 6, 2, 2), dtype=np.float32)
            output[:, 4, :, :] = 1
            return output

    monkeypatch.setattr(inference_segnet, "Segnet", FakeSegnet)
    image = np.zeros((4, 4), dtype=np.uint8)

    staff, symbols, stems, notes, clefs = memory_efficient_inference(
        image, use_gpu_inference=False, batch_size=2, step_size=2, win_size=2
    )

    assert staff.dtype == np.uint8
    assert np.all(staff == 1)
    for mask in (symbols, stems, notes, clefs):
        assert mask.dtype == np.uint8
        assert not np.any(mask)


def test_streaming_homr_caps_upstream_batch_at_two(monkeypatch):
    from homr.segmentation import inference_segnet
    from tonnze.recognition.homr_memory import memory_efficient_inference

    seen_batch_sizes: list[int] = []

    class FakeSegnet:
        def __init__(self, _use_gpu: bool) -> None:
            pass

        def run(self, batch: np.ndarray) -> np.ndarray:
            seen_batch_sizes.append(len(batch))
            output = np.zeros((len(batch), 6, 2, 2), dtype=np.float32)
            output[:, 4, :, :] = 1
            return output

    monkeypatch.setattr(inference_segnet, "Segnet", FakeSegnet)
    memory_efficient_inference(
        np.zeros((4, 8), dtype=np.uint8),
        use_gpu_inference=False,
        batch_size=8,
        step_size=2,
        win_size=2,
    )

    assert seen_batch_sizes
    assert max(seen_batch_sizes) == 2


def test_streaming_homr_tiles_match_upstream_rgb_values(monkeypatch):
    from homr.segmentation import inference_segnet
    from tonnze.recognition.homr_memory import memory_efficient_inference

    seen_tiles: list[np.ndarray] = []

    class RecordingSegnet:
        def __init__(self, _use_gpu: bool) -> None:
            pass

        def run(self, batch: np.ndarray) -> np.ndarray:
            seen_tiles.extend(batch.copy())
            output = np.zeros((len(batch), 6, 2, 2), dtype=np.float32)
            output[:, 4, :, :] = 1
            return output

    monkeypatch.setattr(inference_segnet, "Segnet", RecordingSegnet)
    image = np.arange(8, dtype=np.uint8).reshape(2, 4)

    memory_efficient_inference(
        image, use_gpu_inference=False, batch_size=2, step_size=2, win_size=2
    )

    expected = [
        np.broadcast_to(image[:, :2], (3, 2, 2)).astype(np.float32),
        np.broadcast_to(image[:, 2:], (3, 2, 2)).astype(np.float32),
    ]
    assert len(seen_tiles) == len(expected)
    for actual, wanted in zip(seen_tiles, expected, strict=True):
        np.testing.assert_array_equal(actual, wanted)


def test_homr_onnx_sessions_limit_worker_threads(monkeypatch):
    import onnxruntime as ort

    from tonnze.recognition.homr_memory import _install_onnx_thread_limit

    captured: dict = {}

    def fake_session(*_args, **kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(ort, "InferenceSession", fake_session)
    _install_onnx_thread_limit(2)

    ort.InferenceSession("model.onnx")

    options = captured["sess_options"]
    assert options.intra_op_num_threads == 2
    assert options.inter_op_num_threads == 1
    assert options.execution_mode == ort.ExecutionMode.ORT_SEQUENTIAL


def test_streaming_merge_matches_homr_overlap_semantics(monkeypatch):
    from homr.segmentation import inference_segnet
    from tonnze.recognition.homr_memory import memory_efficient_inference

    class PositionSegnet:
        def __init__(self, _use_gpu: bool) -> None:
            self.next_class = 1

        def run(self, batch: np.ndarray) -> np.ndarray:
            output = np.zeros((len(batch), 6, 4, 4), dtype=np.float32)
            for index in range(len(batch)):
                output[index, self.next_class, :, :] = 1
                self.next_class += 1
            return output

    monkeypatch.setattr(inference_segnet, "Segnet", PositionSegnet)
    image = np.arange(25, dtype=np.uint8).reshape(5, 5)
    arguments = {
        "use_gpu_inference": False,
        "batch_size": 2,
        "step_size": 3,
        "win_size": 4,
    }

    upstream = inference_segnet.inference(image, **arguments)
    streaming = memory_efficient_inference(image, **arguments)

    for expected, actual in zip(upstream, streaming, strict=True):
        np.testing.assert_array_equal(actual, expected)


def test_homr_runner_resolves_third_party_package():
    runner = Path(score_recognition.__file__).parents[1] / "recognition" / "homr_runner.py"
    result = subprocess.run(
        [sys.executable, str(runner), "--help"],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "optical music recognition" in result.stdout.lower()


def test_rapidocr_result_crosses_process_boundary_as_json(monkeypatch, tmp_path):
    from tonnze.recognition import ocr

    image = tmp_path / "score.png"
    image.write_bytes(b"image")
    expected = [{"text": "p", "confidence": 0.9, "box": [[0.0, 0.0]]}]

    def fake_run(command, *, cwd, check):
        assert cwd == tmp_path
        assert check is False
        Path(command[-1]).write_text(
            '[{"text":"p","confidence":0.9,"box":[[0.0,0.0]]}]',
            encoding="utf-8",
        )
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(ocr.subprocess, "run", fake_run)

    assert ocr.recognize_isolated(image) == expected
    assert not (tmp_path / "ocr-result.json").exists()
