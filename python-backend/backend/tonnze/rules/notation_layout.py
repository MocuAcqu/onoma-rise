"""Conservative, score-independent engraving rules for HOMR MusicXML.

Recognition decides which symbols exist. This module only repairs structural
invariants and supplies layout hints that can be inferred from music theory.
It deliberately drops ambiguous long phantom slurs instead of inventing notes.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path


_STEP = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
_CLEF_REFERENCE = {"G": (4, "G"), "F": (3, "F"), "C": (4, "C")}


@dataclass
class SlurEvent:
    kind: str
    number: str
    staff: str
    voice: str
    measure_index: int
    system_index: int
    note: ET.Element
    notations: ET.Element
    element: ET.Element
    center_pitch: int | None
    staff_center: int | None
    stem: str | None


@dataclass
class SlurPair:
    start: SlurEvent
    stop: SlurEvent
    continues: list[SlurEvent] = field(default_factory=list)


def _namespace(root: ET.Element):
    match = re.match(r"\{(.+)\}", root.tag)
    uri = match.group(1) if match else None
    if uri:
        ET.register_namespace("", uri)
    return lambda tag: f"{{{uri}}}{tag}" if uri else tag


def _pitch_index(note: ET.Element, q) -> int | None:
    pitch = note.find(q("pitch"))
    if pitch is None:
        return None
    step = pitch.findtext(q("step"))
    octave = pitch.findtext(q("octave"))
    if step not in _STEP or octave is None:
        return None
    return int(octave) * 7 + _STEP[step]


def _clef_center(sign: str | None, line: str | None) -> int | None:
    if sign not in _CLEF_REFERENCE or not line:
        return None
    octave, step = _CLEF_REFERENCE[sign]
    return octave * 7 + _STEP[step] + (3 - int(line)) * 2


def _placement(pair: SlurPair, voice_means: dict[tuple[str, str], float]) -> str | None:
    existing = pair.start.element.get("placement")
    if existing in {"above", "below"}:
        return existing

    # In polyphonic writing, keep the upper voice above and the lower voice
    # below. Mean pitch is safer than assuming a particular voice numbering.
    lane = (pair.start.staff, pair.start.voice)
    same_staff = {
        voice: mean for (staff, voice), mean in voice_means.items()
        if staff == pair.start.staff
    }
    if len(same_staff) > 1 and lane in voice_means:
        ordered = sorted(same_staff.items(), key=lambda item: item[1])
        if pair.start.voice == ordered[0][0]:
            return "below"
        if pair.start.voice == ordered[-1][0]:
            return "above"

    # Explicit stem direction is the strongest local engraving hint.
    stems = [value for value in (pair.start.stem, pair.stop.stem) if value in {"up", "down"}]
    if stems and len(set(stems)) == 1:
        return "above" if stems[0] == "down" else "below"

    # With no stem information, use staff position (not staff number): high
    # phrases curve above, low phrases below. This remains correct through clef
    # changes because staff_center is computed from the active clef.
    values = [
        event.center_pitch - event.staff_center
        for event in (pair.start, pair.stop)
        if event.center_pitch is not None and event.staff_center is not None
    ]
    if values:
        return "above" if sum(values) / len(values) >= 0 else "below"
    return None


def apply_notation_rules(path: Path) -> dict:
    tree = ET.parse(path)
    root = tree.getroot()
    q = _namespace(root)
    report = {
        "slurs_detected": 0,
        "slurs_kept": 0,
        "slurs_removed_unpaired": 0,
        "slurs_removed_cross_system": 0,
        "placements": {"above": 0, "below": 0, "automatic": 0},
    }

    for part in root.findall(q("part")):
        clefs: dict[str, int] = {}
        system_index = 0
        events: list[SlurEvent] = []
        voice_pitches: dict[tuple[str, str], list[int]] = {}
        for measure_index, measure in enumerate(part.findall(q("measure"))):
            printed = measure.find(q("print"))
            if printed is not None and printed.get("new-system") == "yes":
                system_index += 1
            for attributes in measure.findall(q("attributes")):
                for clef in attributes.findall(q("clef")):
                    staff = clef.get("number", "1")
                    center = _clef_center(clef.findtext(q("sign")), clef.findtext(q("line")))
                    if center is not None:
                        clefs[staff] = center
            for note in measure.findall(q("note")):
                staff = note.findtext(q("staff"), default="1")
                voice = note.findtext(q("voice"), default="1")
                pitch = _pitch_index(note, q)
                if pitch is not None:
                    voice_pitches.setdefault((staff, voice), []).append(pitch)
                notations = note.find(q("notations"))
                if notations is None:
                    continue
                for slur in notations.findall(q("slur")):
                    events.append(SlurEvent(
                        kind=slur.get("type", ""), number=slur.get("number", "1"),
                        staff=staff, voice=voice, measure_index=measure_index,
                        system_index=system_index, note=note, notations=notations,
                        element=slur, center_pitch=pitch, staff_center=clefs.get(staff),
                        stem=note.findtext(q("stem")),
                    ))

        # A one-note voice is commonly an OMR voice-assignment glitch, not real
        # polyphony. Do not let it flip every slur on that staff.
        voice_means = {
            lane: sum(values) / len(values)
            for lane, values in voice_pitches.items()
            if len(values) >= 2
        }
        report["slurs_detected"] += sum(event.kind == "start" for event in events)
        opened: dict[tuple[str, str, str], SlurEvent] = {}
        continuations: dict[tuple[str, str, str], list[SlurEvent]] = {}
        pairs: list[SlurPair] = []
        for event in events:
            key = (event.staff, event.voice, event.number)
            if event.kind == "start":
                previous = opened.pop(key, None)
                if previous:
                    previous.notations.remove(previous.element)
                    report["slurs_removed_unpaired"] += 1
                opened[key] = event
                continuations[key] = []
            elif event.kind == "continue" and key in opened:
                continuations[key].append(event)
            elif event.kind == "stop":
                start = opened.pop(key, None)
                if start:
                    pairs.append(SlurPair(start, event, continuations.pop(key, [])))
                else:
                    event.notations.remove(event.element)
                    report["slurs_removed_unpaired"] += 1
        for key, start in opened.items():
            start.notations.remove(start.element)
            for event in continuations.get(key, []):
                event.notations.remove(event.element)
            report["slurs_removed_unpaired"] += 1
        for pair in pairs:
            system_span = pair.stop.system_index - pair.start.system_index
            # Cross-system curves are allowed, but more than one break without
            # explicit continuation data is too ambiguous for raster OMR.
            if system_span > 1 and not pair.continues:
                pair.start.notations.remove(pair.start.element)
                pair.stop.notations.remove(pair.stop.element)
                report["slurs_removed_cross_system"] += 1
                continue
            placement = _placement(pair, voice_means)
            if placement:
                orientation = "over" if placement == "above" else "under"
                for event in [pair.start, *pair.continues, pair.stop]:
                    event.element.set("placement", placement)
                    event.element.set("orientation", orientation)
                report["placements"][placement] += 1
            else:
                report["placements"]["automatic"] += 1
            report["slurs_kept"] += 1

    tree.write(path, encoding="utf-8", xml_declaration=True)
    return report
