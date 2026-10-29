"""Extract beat-domain ornaments without flattening their engraved notation."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path


_STEPS = ("C", "D", "E", "F", "G", "A", "B")
_NATURAL = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
_SHARP_ORDER = ("F", "C", "G", "D", "A", "E", "B")
_FLAT_ORDER = ("B", "E", "A", "D", "G", "C", "F")


def _namespace(root: ET.Element):
    match = re.match(r"\{(.+)}", root.tag)
    uri = match.group(1) if match else None
    return lambda tag: f"{{{uri}}}{tag}" if uri else tag


def _number(element: ET.Element | None, default=0) -> int:
    try:
        return int((element.text if element is not None else default) or default)
    except (TypeError, ValueError):
        return default


def _pitch(note: ET.Element, q) -> tuple[int, str] | None:
    pitch = note.find(q("pitch"))
    if pitch is None:
        return None
    step = (pitch.findtext(q("step")) or "C").upper()
    octave = _number(pitch.find(q("octave")), 4)
    alter = _number(pitch.find(q("alter")), 0)
    return 12 * (octave + 1) + _NATURAL.get(step, 0) + alter, step


def _upper_auxiliary(midi: int, step: str, fifths: int) -> int:
    pitch_class = midi % 12
    step = _STEPS[(_STEPS.index(step) + 1) % len(_STEPS)]
    accidental = 0
    if fifths > 0 and step in _SHARP_ORDER[:fifths]:
        accidental = 1
    elif fifths < 0 and step in _FLAT_ORDER[:abs(fifths)]:
        accidental = -1
    target_pc = (_NATURAL[step] + accidental) % 12
    interval = (target_pc - pitch_class) % 12 or 12
    return midi + interval


def _lower_auxiliary(midi: int, step: str, fifths: int) -> int:
    pitch_class = midi % 12
    step = _STEPS[(_STEPS.index(step) - 1) % len(_STEPS)]
    accidental = 0
    if fifths > 0 and step in _SHARP_ORDER[:fifths]:
        accidental = 1
    elif fifths < 0 and step in _FLAT_ORDER[:abs(fifths)]:
        accidental = -1
    target_pc = (_NATURAL[step] + accidental) % 12
    interval = (pitch_class - target_pc) % 12 or 12
    return midi - interval


def _tag(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def ornament_events(source: Path) -> list[dict]:
    root = ET.parse(source).getroot()
    q = _namespace(root)
    events: list[dict] = []
    open_wavy: dict[tuple[int, str], dict] = {}
    open_tremolo: dict[tuple[int, str], dict] = {}

    for part_index, part in enumerate(root.findall(q("part")), start=1):
        divisions, fifths = 1, 0
        time_beats, beat_type = 4, 4
        absolute_beat = 0.0
        pending_grace: dict[tuple[str, str], list[dict]] = {}
        for measure in part.findall(q("measure")):
            cursor = last_note_start = max_end = 0
            try:
                measure_number = int(measure.get("number", "0"))
            except ValueError:
                measure_number = 0
            attributes = measure.find(q("attributes"))
            if attributes is not None:
                divisions = max(1, _number(attributes.find(q("divisions")), divisions))
                fifths = _number(attributes.find(f"{q('key')}/{q('fifths')}"), fifths)
                time = attributes.find(q("time"))
                if time is not None:
                    time_beats = max(1, _number(time.find(q("beats")), time_beats))
                    beat_type = max(1, _number(time.find(q("beat-type")), beat_type))

            for element in list(measure):
                name = _tag(element)
                if name == "backup":
                    cursor -= _number(element.find(q("duration")))
                    continue
                if name == "forward":
                    cursor += _number(element.find(q("duration")))
                    max_end = max(max_end, cursor)
                    continue
                if name != "note":
                    continue

                grace = element.find(q("grace"))
                chord = element.find(q("chord")) is not None
                duration_units = _number(element.find(q("duration")))
                start_units = last_note_start if chord else cursor
                if not chord:
                    last_note_start = start_units
                    if grace is None:
                        cursor += duration_units
                max_end = max(max_end, start_units + duration_units)
                start_beat = absolute_beat + start_units / divisions
                duration_beats = duration_units / divisions
                pitch = _pitch(element, q)
                if pitch is None:
                    continue
                midi, pitch_step = pitch
                voice = element.findtext(q("voice")) or "1"
                staff = element.findtext(q("staff")) or "1"
                voice_key = (voice, staff)

                if grace is not None:
                    pending_grace.setdefault(voice_key, []).append({
                        "midi": midi,
                        "slash": grace.get("slash") == "yes",
                    })
                    continue
                if pending_grace.get(voice_key):
                    grace_notes = pending_grace.pop(voice_key)
                    events.append({
                        "id": f"grace:{part_index}:{measure_number}:{len(events)}",
                        "kind": "grace",
                        "ornament": "acciaccatura" if any(item["slash"] for item in grace_notes) else "appoggiatura",
                        "part": part_index,
                        "measure": measure_number,
                        "startBeat": round(start_beat, 6),
                        "endBeat": round(start_beat + duration_beats, 6),
                        "principalMidi": midi,
                        "pitches": [item["midi"] for item in grace_notes],
                    })

                notations = element.find(q("notations"))
                if notations is None:
                    continue
                ornaments = notations.find(q("ornaments"))
                if ornaments is not None:
                    trill = ornaments.find(q("trill-mark")) is not None
                    wavy_lines = ornaments.findall(q("wavy-line"))
                    if trill or any(item.get("type") == "start" for item in wavy_lines):
                        event = {
                            "id": f"trill:{part_index}:{measure_number}:{len(events)}",
                            "kind": "ornament", "ornament": "trill",
                            "part": part_index, "measure": measure_number,
                            "startBeat": round(start_beat, 6),
                            "endBeat": round(start_beat + max(duration_beats, 0.25), 6),
                            "principalMidi": midi,
                            "auxiliaryMidi": _upper_auxiliary(midi, pitch_step, fifths),
                        }
                        events.append(event)
                        for line in wavy_lines:
                            if line.get("type") == "start":
                                open_wavy[(part_index, line.get("number", "1"))] = event
                    for line in wavy_lines:
                        key = (part_index, line.get("number", "1"))
                        if line.get("type") == "stop" and key in open_wavy:
                            open_wavy.pop(key)["endBeat"] = round(
                                start_beat + max(duration_beats, 0), 6
                            )

                    for ornament in list(ornaments):
                        ornament_name = _tag(ornament)
                        if ornament_name in {
                            "mordent", "inverted-mordent", "turn", "inverted-turn",
                            "delayed-turn", "shake", "schleifer",
                        }:
                            events.append({
                                "id": f"{ornament_name}:{part_index}:{measure_number}:{len(events)}",
                                "kind": "ornament", "ornament": ornament_name,
                                "part": part_index, "measure": measure_number,
                                "startBeat": round(start_beat, 6),
                                "endBeat": round(start_beat + max(duration_beats, 0.25), 6),
                                "principalMidi": midi,
                                "auxiliaryMidi": _upper_auxiliary(midi, pitch_step, fifths),
                                "lowerAuxiliaryMidi": _lower_auxiliary(midi, pitch_step, fifths),
                            })
                        elif ornament_name == "tremolo":
                            tremolo_type = ornament.get("type", "single")
                            number = ornament.get("number", "1")
                            strokes = _number(ornament, 3)
                            key = (part_index, number)
                            if tremolo_type in {"single", "start"}:
                                event = {
                                    "id": f"tremolo:{part_index}:{measure_number}:{len(events)}",
                                    "kind": "ornament", "ornament": "tremolo",
                                    "part": part_index, "measure": measure_number,
                                    "startBeat": round(start_beat, 6),
                                    "endBeat": round(start_beat + max(duration_beats, 0.25), 6),
                                    "principalMidi": midi, "strokes": strokes,
                                }
                                events.append(event)
                                if tremolo_type == "start":
                                    open_tremolo[key] = event
                            elif tremolo_type == "stop" and key in open_tremolo:
                                event = open_tremolo.pop(key)
                                event["endBeat"] = round(start_beat + duration_beats, 6)
                                event["secondaryMidi"] = midi

                if notations.find(q("arpeggiate")) is not None:
                    events.append({
                        "id": f"arpeggiate:{part_index}:{measure_number}:{len(events)}",
                        "kind": "ornament", "ornament": "arpeggiate",
                        "part": part_index, "measure": measure_number,
                        "startBeat": round(start_beat, 6),
                        "endBeat": round(start_beat + max(duration_beats, 0.25), 6),
                        "principalMidi": midi,
                    })

            actual_beats = max_end / divisions
            nominal_beats = time_beats * 4 / beat_type
            absolute_beat += actual_beats if actual_beats > 0 else nominal_beats

    return sorted(events, key=lambda item: (item["startBeat"], item["part"], item["id"]))
