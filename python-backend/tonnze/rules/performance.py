"""Convert recognized musical terms into deterministic beat-domain playback rules."""
from __future__ import annotations

from music21 import bar, stream

from tonnze.rules.dynamics import DEFAULT_DYNAMIC_RAMP, DYNAMIC_VELOCITY
from tonnze.rules.expressions import EXPRESSION_PLAYBACK


# Formal section boundaries restart at a neutral written level unless the new
# section prints its own dynamic mark at that exact position.
SECTION_DYNAMIC = DYNAMIC_VELOCITY["mf"]
STRUCTURAL_BARLINE_TYPES = {"double", "final", "heavy-light", "heavy-heavy"}


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


def _dynamic_reset_beats(score) -> list[float]:
    """Find double barlines and repeat signs that restart dynamic rules."""
    part = score.parts[0]
    resets: set[float] = set()
    score_end = 0.0
    for measure in part.getElementsByClass(stream.Measure):
        start = float(measure.getOffsetInHierarchy(part))
        length = float(
            measure.barDuration.quarterLength
            or measure.duration.quarterLength
            or 4
        )
        end = start + length
        score_end = max(score_end, end)
        for marker, boundary in (
            (measure.leftBarline, start),
            (measure.rightBarline, end),
        ):
            if marker is None:
                continue
            is_repeat = isinstance(marker, bar.Repeat)
            is_double = getattr(marker, "type", None) in STRUCTURAL_BARLINE_TYPES
            if is_repeat or is_double:
                resets.add(boundary)

    # Beat zero already starts at SECTION_DYNAMIC. A final barline has no
    # following note whose volume needs to be recalculated.
    return sorted(value for value in resets if 0 < value < score_end)


def performance_events(score, terms: list[dict]) -> list[dict]:
    starts, score_end = _measure_beats(score)
    if not starts:
        return []
    last_measure = max(starts)

    def beat(term: dict) -> float:
        if "_beat" in term:
            return float(term["_beat"])
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

    reset_beats = _dynamic_reset_beats(score)
    reset_terms = [
        {
            "_beat": reset_beat,
            "kind": "dynamic_reset",
            "text": "section dynamic reset",
        }
        for reset_beat in reset_beats
    ]
    # Process the reset before a marking printed exactly at the boundary, so
    # that p/f/mf on the new section overrides the neutral reset immediately.
    ordered = sorted(
        [*terms, *reset_terms],
        key=lambda item: (
            beat(item),
            0 if item.get("kind") == "dynamic_reset" else 1,
            item.get("x", 0),
        ),
    )
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
            next_reset = next(
                (value for value in reset_beats if value > start),
                score_end,
            )
            end = min(max(start + 1, two_measure_end(term)), next_reset)
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
        elif kind == "dynamic_reset":
            current_dynamic = SECTION_DYNAMIC
            events.append({
                "kind": "dynamic", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": current_dynamic,
                "endValue": current_dynamic, "label": "section reset",
            })
        elif kind == "dynamic":
            current_dynamic = float(term.get("velocity", DYNAMIC_VELOCITY.get(term["text"], 0.64)))
            events.append({
                "kind": "dynamic", "curve": "step", "startBeat": start,
                "endBeat": start, "startValue": current_dynamic,
                "endValue": current_dynamic, "label": term["text"],
            })
        elif kind in {"gradual_louder", "gradual_softer"}:
            next_reset = next(
                (value for value in reset_beats if value > start),
                score_end,
            )
            next_dynamic = next(
                (
                    item for item in ordered[index + 1:]
                    if item.get("kind") == "dynamic" and beat(item) <= next_reset
                ),
                None,
            )
            end = min(
                beat(next_dynamic) if next_dynamic else two_measure_end(term),
                next_reset,
            )
            # Preserve the old one-beat minimum only when it stays inside the
            # current formal section.
            end = max(end, min(start + 1, next_reset))
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
                "endBeat": end, "startValue": round(current_dynamic, 3),
                "endValue": round(target, 3), "label": term["text"],
            })
            current_dynamic = target
        elif kind == "expression" and term["text"] in EXPRESSION_PLAYBACK:
            next_expression = next(
                (item for item in ordered[index + 1:] if item.get("kind") == "expression"),
                None,
            )
            end = beat(next_expression) if next_expression else score_end
            events.append({
                "kind": "expression", "curve": "step", "startBeat": start,
                "endBeat": max(start, end), "label": term["text"],
                **EXPRESSION_PLAYBACK[term["text"]],
            })
    return events
