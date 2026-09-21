"""Convert recognized musical terms into deterministic beat-domain playback rules."""
from __future__ import annotations

from music21 import stream

from tonnze.rules.dynamics import DEFAULT_DYNAMIC_RAMP, DYNAMIC_VELOCITY


def _measure_beats(score) -> tuple[dict[int, float], float]:
    part = score.parts[0]
    starts: dict[int, float] = {}
    end = 0.0
    for measure in part.getElementsByClass(stream.Measure):
        number = int(measure.number)
        start = float(measure.getOffsetInHierarchy(part))
        starts[number] = start
        length = float(measure.barDuration.quarterLength or measure.duration.quarterLength or 4)
        end = max(end, start + length)
    return starts, end


def performance_events(score, terms: list[dict]) -> list[dict]:
    starts, score_end = _measure_beats(score)
    if not starts:
        return []
    last_measure = max(starts)

    def beat(term: dict) -> float:
        return (
            starts.get(int(term.get("measure") or 1), 0.0)
            + float(term.get("beat_offset") or 0.0)
        )

    def two_measure_end(term: dict) -> float:
        number = int(term.get("measure") or 1)
        explicit = term.get("end_measure")
        if explicit:
            return (
                starts.get(int(explicit), score_end)
                + float(term.get("end_beat_offset") or 0.0)
            )
        return starts.get(number + 2, score_end)

    ordered = sorted(terms, key=lambda item: (beat(item), item.get("x", 0)))
    initial_tempo = next((float(item["bpm"]) for item in ordered if item.get("bpm")), 120.0)
    current_tempo = initial_tempo
    current_dynamic = 0.64
    events = []
    for index, term in enumerate(ordered):
        kind = term.get("kind")
        start = beat(term)
        if kind == "tempo":
            current_tempo = float(term["bpm"])
            events.append({
                "kind": "tempo", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": current_tempo,
                "endValue": current_tempo, "label": term["text"],
            })
        elif kind == "restore_tempo":
            current_tempo = initial_tempo
            events.append({
                "kind": "tempo", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": current_tempo,
                "endValue": current_tempo, "label": term["text"],
            })
        elif kind in {"gradual_slow", "gradual_fast"}:
            end = two_measure_end(term)
            target = current_tempo * (0.82 if kind == "gradual_slow" else 1.18)
            events.append({
                "kind": "tempo", "curve": "linear", "startBeat": start,
                "endBeat": max(start + 1, end), "startValue": round(current_tempo, 3),
                "endValue": round(target, 3), "label": term["text"],
            })
            current_tempo = target
        elif kind in {"relative_slow", "relative_fast"}:
            current_tempo *= 0.88 if kind == "relative_slow" else 1.12
            events.append({
                "kind": "tempo", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": round(current_tempo, 3),
                "endValue": round(current_tempo, 3), "label": term["text"],
            })
        elif kind in {"broaden", "fade"}:
            end = max(start + 1, two_measure_end(term))
            target_tempo = current_tempo * 0.82
            target_dynamic = min(1.0, max(
                0.12, current_dynamic + (0.14 if kind == "broaden" else -0.18)
            ))
            events.extend((
                {
                    "kind": "tempo", "curve": "linear", "startBeat": start,
                    "endBeat": end, "startValue": round(current_tempo, 3),
                    "endValue": round(target_tempo, 3), "label": term["text"],
                },
                {
                    "kind": "dynamic", "curve": "linear", "startBeat": start,
                    "endBeat": end, "startValue": round(current_dynamic, 3),
                    "endValue": round(target_dynamic, 3), "label": term["text"],
                },
            ))
            current_tempo, current_dynamic = target_tempo, target_dynamic
        elif kind == "dynamic":
            current_dynamic = float(term.get("velocity", DYNAMIC_VELOCITY.get(term["text"], 0.64)))
            events.append({
                "kind": "dynamic", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": current_dynamic,
                "endValue": current_dynamic, "label": term["text"],
            })
        elif kind in {"gradual_louder", "gradual_softer"}:
            next_dynamic = next(
                (item for item in ordered[index + 1:] if item.get("kind") == "dynamic"), None
            )
            end = beat(next_dynamic) if next_dynamic else two_measure_end(term)
            target = (
                float(next_dynamic.get("velocity")) if next_dynamic
                else current_dynamic + (
                    DEFAULT_DYNAMIC_RAMP if kind == "gradual_louder"
                    else -DEFAULT_DYNAMIC_RAMP
                )
            )
            target = min(1.0, max(0.12, target))
            events.append({
                "kind": "dynamic", "curve": "linear", "startBeat": start,
                "endBeat": max(start + 1, end), "startValue": round(current_dynamic, 3),
                "endValue": round(target, 3), "label": term["text"],
            })
            current_dynamic = target
    return events
