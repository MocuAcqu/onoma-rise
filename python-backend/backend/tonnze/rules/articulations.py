"""Convert written articulations to non-destructive playback envelopes."""
from __future__ import annotations


ARTICULATION_RULES = {
    "staccato": {"gate": 0.50, "velocityDelta": 0.00},
    "staccatissimo": {"gate": 0.25, "velocityDelta": 0.02},
    "tenuto": {"gate": 0.95, "velocityDelta": 0.00},
    "accent": {"gate": 0.90, "velocityDelta": 0.12},
    "strong accent": {"gate": 0.80, "velocityDelta": 0.20},
    "detached legato": {"gate": 0.75, "velocityDelta": 0.00},
    "spiccato": {"gate": 0.40, "velocityDelta": 0.05},
}


def articulation_events(score) -> list[dict]:
    events = []
    for part_index, part in enumerate(score.parts, start=1):
        for item in part.flatten().notes:
            if not getattr(item, "articulations", None):
                continue
            start = float(item.getOffsetInHierarchy(part))
            end = start + float(item.duration.quarterLength)
            pitches = [pitch.midi for pitch in item.pitches]
            for articulation in item.articulations:
                name = (getattr(articulation, "name", "") or "").lower()
                rule = ARTICULATION_RULES.get(name)
                if not rule:
                    continue
                events.append({
                    "id": f"articulation:{part_index}:{len(events)}",
                    "kind": "articulation", "articulation": name,
                    "part": part_index, "startBeat": round(start, 6),
                    "endBeat": round(end, 6), "pitches": pitches, **rule,
                })
    return events
