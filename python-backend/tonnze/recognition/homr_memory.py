"""Memory-bounded replacements for HOMR's segmentation hot path.

HOMR 0.7 stores every segmentation tile as an ``int64`` array and merges the
complete list only after inference.  This module preserves the same tiling and
averaging semantics while accumulating each batch immediately as ``uint8``.
"""
from __future__ import annotations

from concurrent.futures import Future
from time import perf_counter
from typing import Any

import numpy as np


_MAXIMUM_BATCH_SIZE = 2


def _extract_grayscale_patch(
    image: np.ndarray,
    y: int,
    x: int,
    win_size: int,
) -> np.ndarray:
    """Create one RGB-equivalent tile without a full-page RGB float copy."""
    height, width = image.shape
    patch = np.full((3, win_size, win_size), 255, dtype=np.float32)
    y0 = max(y, 0)
    x0 = max(x, 0)
    y1 = min(y + win_size, height)
    x1 = min(x + win_size, width)
    patch[:, : y1 - y0, : x1 - x0] = image[y0:y1, x0:x1]
    return patch


def _install_onnx_thread_limit(maximum_threads: int) -> None:
    """Give HOMR sessions small, deterministic CPU worker pools.

    ONNX Runtime otherwise creates a pool sized for the host for every model.
    HOMR owns three sessions (SegNet plus the TrOMR encoder and decoder), which
    wastes stack memory and CPU scheduling time on a one-CPU deployment.
    """
    import onnxruntime as ort

    current: Any = ort.InferenceSession
    if getattr(current, "_onoma_maximum_threads", None) == maximum_threads:
        return
    original = getattr(current, "_onoma_original", current)

    def bounded_inference_session(*args: Any, **kwargs: Any):
        # Respect an explicit caller-owned SessionOptions object. HOMR does not
        # supply one, so its three sessions receive the bounded defaults below.
        has_positional_options = len(args) >= 2 and args[1] is not None
        if not has_positional_options and kwargs.get("sess_options") is None:
            options = ort.SessionOptions()
            options.intra_op_num_threads = maximum_threads
            options.inter_op_num_threads = 1
            options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
            kwargs["sess_options"] = options
        return original(*args, **kwargs)

    bounded_inference_session._onoma_original = original
    bounded_inference_session._onoma_maximum_threads = maximum_threads
    ort.InferenceSession = bounded_inference_session


def _accumulate_tile(
    labels: np.ndarray,
    y: int,
    x: int,
    image_shape: tuple[int, int],
    win_size: int,
    reconstructed: np.ndarray,
    weight: np.ndarray,
) -> None:
    """Merge one tile using the same bounds as HOMR's merge_patches."""
    height, width = image_shape
    y0 = max(y, 0)
    x0 = max(x, 0)
    y1 = min(y + win_size, height)
    x1 = min(x + win_size, width)
    patch_height = y1 - y0
    patch_width = x1 - x0
    reconstructed[y0:y1, x0:x1] += labels[:patch_height, :patch_width]
    weight[y0:y1, x0:x1] += 1


def memory_efficient_inference(
    image_org: np.ndarray,
    use_gpu_inference: bool,
    batch_size: int,
    step_size: int,
    win_size: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Run HOMR segmentation without retaining a page-sized list of tiles."""
    # Imports stay inside the function so normal API/worker startup does not
    # load HOMR or create ONNX-related module state before a score job starts.
    from homr.segmentation.inference_segnet import Segnet
    from homr.simple_logging import eprint

    eprint("Starting memory-efficient inference.")
    started = perf_counter()
    # HOMR requests eight tiles at once. On the measured page, limiting this
    # to two cut the peak substantially without changing its detections.
    batch_size = max(1, min(batch_size, _MAXIMUM_BATCH_SIZE))
    if step_size < 0:
        step_size = win_size // 2

    model = Segnet(use_gpu_inference)
    height, width = image_org.shape

    # These two page buffers replace HOMR's list of all int64 tile labels.
    # float32 is retained here to preserve its overlap-averaging behavior.
    reconstructed = np.zeros((height, width), dtype=np.float32)
    weight = np.zeros((height, width), dtype=np.float32)
    batch: list[np.ndarray] = []
    coordinates: list[tuple[int, int]] = []

    def flush_batch() -> None:
        if not batch:
            return
        batch_output = model.run(np.stack(batch, axis=0))
        for output, (tile_y, tile_x) in zip(batch_output, coordinates, strict=True):
            # There are only six segmentation classes. uint8 stores the exact
            # same labels using one eighth of NumPy's default int64 footprint.
            labels = np.argmax(output, axis=0).astype(np.uint8, copy=False)
            _accumulate_tile(
                labels,
                tile_y,
                tile_x,
                (height, width),
                win_size,
                reconstructed,
                weight,
            )
        # Release input/output references before the next ONNX batch begins.
        batch.clear()
        coordinates.clear()

    for y_loop in range(0, max(height, win_size), step_size):
        y = min(y_loop, height - win_size)
        for x_loop in range(0, max(width, win_size), step_size):
            x = min(x_loop, width - win_size)
            # Expand only the live tile to three float channels. The model sees
            # the same values as HOMR's gray -> BGR -> CHW conversion, without
            # retaining a roughly 60 MiB float page at 1920 px width.
            batch.append(_extract_grayscale_patch(image_org, y, x, win_size))
            coordinates.append((y, x))
            if len(batch) == batch_size:
                flush_batch()
    flush_batch()

    # The closure and local model would otherwise remain live while the five
    # full-page masks below are allocated. Release native ONNX state first.
    del flush_batch
    del model

    eprint(
        f"Segnet Inference time: {perf_counter() - started}; "
        f"batch_size {batch_size}; streaming merge"
    )
    weight[weight == 0] = 1
    reconstructed /= weight
    merged = reconstructed.astype(np.uint8)
    # These float pages are no longer needed once the class labels are materialized.
    del reconstructed
    del weight

    stems_rests = (merged == 1).astype(np.uint8)
    notehead = (merged == 2).astype(np.uint8)
    clefs_keys = (merged == 3).astype(np.uint8)
    staff = (merged == 4).astype(np.uint8)
    symbols = (merged == 5).astype(np.uint8)
    return staff, symbols, stems_rests, notehead, clefs_keys


def _empty_title(*_args, **_kwargs) -> Future[str]:
    """Return HOMR's expected Future without loading a second OCR engine."""
    completed: Future[str] = Future()
    completed.set_result("")
    return completed


def install(
    *,
    maximum_batch_size: int = 2,
    enable_title_ocr: bool = False,
    onnx_threads: int = 2,
) -> None:
    """Install bounded inference before ``homr.main`` imports its functions."""
    if maximum_batch_size <= 0:
        raise ValueError("maximum_batch_size must be greater than zero")
    if onnx_threads <= 0:
        raise ValueError("onnx_threads must be greater than zero")
    global _MAXIMUM_BATCH_SIZE
    _MAXIMUM_BATCH_SIZE = maximum_batch_size
    _install_onnx_thread_limit(onnx_threads)

    from homr.segmentation import inference_segnet

    inference_segnet.inference = memory_efficient_inference
    if not enable_title_ocr:
        # HOMR normally starts RapidOCR in a thread while TrOMR loads its
        # encoder and decoder. The project performs its own term OCR later, so
        # overlapping a second OCR model only raises the process peak.
        from homr import title_detection

        title_detection.detect_title = _empty_title
