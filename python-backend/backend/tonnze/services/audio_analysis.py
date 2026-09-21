"""Basic Pitch transcription, chord analysis and key estimation."""
from __future__ import annotations
from pathlib import Path
import threading
import librosa
import numpy as np
import pretty_midi

NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
CHORD_TEMPLATES = (
    ("maj7", (0, 4, 7, 11)), ("7", (0, 4, 7, 10)), ("m7", (0, 3, 7, 10)),
    ("m7b5", (0, 3, 6, 10)), ("dim7", (0, 3, 6, 9)), ("add9", (0, 2, 4, 7)),
    ("madd9", (0, 2, 3, 7)), ("", (0, 4, 7)), ("m", (0, 3, 7)),
    ("dim", (0, 3, 6)), ("aug", (0, 4, 8)), ("sus2", (0, 2, 7)), ("sus4", (0, 5, 7)),
)
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

def _model_path() -> Path:
    import basic_pitch
    root = Path(basic_pitch.__file__).parent / "saved_models" / "icassp_2022"
    # ONNX works in the shared Python environment on every supported platform
    # and avoids pulling TensorFlow/CoreML into the score-recognition runtime.
    candidates = (root / "nmp.onnx", root / "nmp.tflite", root / "nmp")
    return next((path for path in candidates if path.exists()), candidates[-1])


class AudioAnalysisService:
    """Own the expensive Basic Pitch model and serialize model inference."""

    def __init__(self) -> None:
        self._model = None
        self._lock = threading.Lock()

    def _get_model(self):
        if self._model is None:
            from basic_pitch.inference import Model
            self._model = Model(_model_path())
        return self._model

    def analyze(self, file_path: str) -> dict:
        with self._lock:
            events = transcribe_polyphonic_events(file_path, self._get_model())
        return {
            "events": events,
            "chords": detect_chords(events),
            "estimatedKey": detect_key(file_path),
        }


def transcribe_polyphonic_events(file_path: str, model=None) -> list[dict]:
    """回傳有真正起訖時間、可信度和頻率的複音音符。"""
    from basic_pitch.inference import Model, predict
    model = model or Model(_model_path())
    _, _, raw_notes = predict(
        file_path, model, onset_threshold=0.55, frame_threshold=0.35,
        minimum_note_length=100.0, minimum_frequency=32.7, maximum_frequency=4186.0,
        multiple_pitch_bends=True, melodia_trick=True,
    )
    events = []
    for start, end, midi_number, amplitude, bends in raw_notes:
        if end - start < 0.1:
            continue
        bend_bins = float(np.median(bends)) if bends else 0.0
        detected_midi = midi_number + bend_bins / 3.0
        events.append({
            "id": f"evt-{len(events)}", "pitch": pretty_midi.note_number_to_name(int(midi_number)),
            "note": pretty_midi.note_number_to_name(int(midi_number)), "midi": int(midi_number),
            "start": round(float(start), 4), "end": round(float(end), 4),
            "confidence": round(float(amplitude), 4),
            "frequencyHz": round(float(librosa.midi_to_hz(midi_number)), 3),
            "detectedFrequencyHz": round(float(librosa.midi_to_hz(detected_midi)), 3),
        })
    return sorted(events, key=lambda event: (event["start"], event["midi"]))

def detect_chords(events: list[dict], window: float = 0.25) -> list[dict]:
    if not events:
        return []
    result, t = [], 0.0
    ordered = sorted(events, key=lambda event: event["start"])
    end_time = max(event["end"] for event in ordered)
    active_events: list[dict] = []
    next_event = 0
    while t < end_time:
        frame_end, weights, bass = min(t + window, end_time), np.zeros(12), None
        while next_event < len(ordered) and ordered[next_event]["start"] < frame_end:
            active_events.append(ordered[next_event])
            next_event += 1
        active_events = [event for event in active_events if event["end"] > t]
        for event in active_events:
            overlap = max(0.0, min(frame_end, event["end"]) - max(t, event["start"]))
            if overlap <= 0:
                continue
            weight = overlap / window * (0.35 + 0.65 * event["confidence"])
            weight *= min(1.0, 0.35 + (event["end"] - event["start"]) / 0.8)
            weights[event["midi"] % 12] += weight
            bass = event["midi"] if bass is None else min(bass, event["midi"])
        active_pitch_classes = (
            set(np.flatnonzero(weights >= max(0.12, weights.max() * 0.22)))
            if weights.any() else set()
        )
        best = None
        for root in range(12):
            for suffix, intervals in CHORD_TEMPLATES:
                pcs = tuple((root + interval) % 12 for interval in intervals)
                score = sum(weights[pc] for pc in pcs) - 0.42 * sum(
                    pc not in active_pitch_classes for pc in pcs
                )
                score -= 0.38 * sum(
                    weights[pc] for pc in active_pitch_classes if pc not in pcs
                )
                if bass is not None and bass % 12 == root:
                    score += 0.15
                if best is None or score > best[0]:
                    best = (float(score), root, suffix, pcs)
        if best is None or len(active_pitch_classes) < 2 or best[0] < 0.15:
            chord, root_name, pcs, confidence = "N.C.", None, (), 0.0
        else:
            _, root, suffix, pcs = best
            root_name, bass_name = NOTE_NAMES[root], NOTE_NAMES[bass % 12] if bass is not None else NOTE_NAMES[root]
            chord = f"{root_name}{suffix}"
            if bass_name != root_name and bass is not None and bass % 12 in pcs:
                chord += f"/{bass_name}"
            covered = sum(weights[pc] for pc in pcs) / (float(weights.sum()) + 1e-9)
            confidence = float(np.clip(
                0.65 * covered
                + 0.35 * sum(pc in active_pitch_classes for pc in pcs) / len(pcs),
                0, 1,
            ))
        frame = {"id": f"chord-{len(result)}", "start": round(t, 4), "end": round(frame_end, 4),
                 "name": chord, "root": root_name, "notes": [NOTE_NAMES[pc] for pc in pcs],
                 "confidence": round(confidence, 4)}
        if result and result[-1]["name"] == frame["name"]:
            result[-1]["end"] = round(frame_end, 4)
            result[-1]["confidence"] = round((result[-1]["confidence"] + confidence) / 2, 4)
        else:
            result.append(frame)
        t = frame_end
    return result

def detect_key(file_path: str) -> dict:
    y, sr = librosa.load(file_path, sr=22050, mono=True)
    chroma = librosa.feature.chroma_cqt(y=librosa.effects.harmonic(y), sr=sr, hop_length=1024)
    energy = np.median(chroma, axis=1)
    if not np.any(energy):
        return {"key": "unknown", "tonic": None, "mode": None, "confidence": 0.0}
    energy = (energy - energy.mean()) / (energy.std() + 1e-9)
    candidates = []
    for tonic in range(12):
        for mode, profile in (("major", MAJOR_PROFILE), ("minor", MINOR_PROFILE)):
            normalized = np.roll(profile, tonic)
            normalized = (normalized - normalized.mean()) / normalized.std()
            candidates.append((float(np.corrcoef(energy, normalized)[0, 1]), tonic, mode))
    candidates.sort(reverse=True)
    score, tonic, mode = candidates[0]
    confidence = float(np.clip((score - candidates[1][0] + 0.08) / 0.45, 0, 1))
    return {"key": f"{NOTE_NAMES[tonic]} {mode}", "tonic": NOTE_NAMES[tonic], "mode": mode,
            "confidence": round(confidence, 4)}

# 保留舊函式名稱，避免其他既有呼叫失效。
transcribe_melody_events_cqt = transcribe_polyphonic_events
