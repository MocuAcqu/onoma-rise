"""Repair conservative measure-duration errors produced by optical recognition."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path


def _namespace(root: ET.Element):
    match = re.match(r"\{(.+)\}", root.tag)
    uri = match.group(1) if match else None
    if uri:
        ET.register_namespace("", uri)
    return lambda tag: f"{{{uri}}}{tag}" if uri else tag


def _positive_int(value: str | None) -> int | None:
    try:
        number = int(value or "")
    except ValueError:
        return None
    return number if number > 0 else None


def normalize_measure_timing(path: Path) -> dict:
    """Clamp impossible full-measure rests to the active time signature.

    HOMR sometimes emits a visual whole rest as four quarter notes even in a
    2/4 or 3/4 measure. Only an overlong, lone rest in one voice is repaired;
    pitched notes and incomplete/implicit measures are left untouched.
    """
    tree = ET.parse(path)
    root = tree.getroot()
    q = _namespace(root)
    report = {
        "full_measure_rests_repaired": 0,
        "backups_repaired": 0,
        "measures_repaired": [],
    }

    for part_index, part in enumerate(root.findall(q("part")), start=1):
        divisions: int | None = None
        beats: int | None = None
        beat_type: int | None = None
        for measure_index, measure in enumerate(part.findall(q("measure")), start=1):
            # HOMR may split divisions, key, time and clefs across multiple
            # attribute blocks in the same measure.
            for attributes in measure.findall(q("attributes")):
                divisions = _positive_int(attributes.findtext(q("divisions"))) or divisions
                time = attributes.find(q("time"))
                if time is not None and time.find(q("senza-misura")) is None:
                    beats = _positive_int(time.findtext(q("beats"))) or beats
                    beat_type = _positive_int(time.findtext(q("beat-type"))) or beat_type

            if (
                measure.get("implicit") == "yes"
                or divisions is None
                or beats is None
                or beat_type is None
            ):
                continue
            capacity_fraction = divisions * beats * 4
            if capacity_fraction % beat_type:
                continue
            capacity = capacity_fraction // beat_type

            lanes: dict[tuple[str, str], list[ET.Element]] = {}
            for note in measure.findall(q("note")):
                if note.find(q("grace")) is not None or note.find(q("chord")) is not None:
                    continue
                lane = (
                    note.findtext(q("staff"), default="1"),
                    note.findtext(q("voice"), default="1"),
                )
                lanes.setdefault(lane, []).append(note)

            repaired = False
            for notes in lanes.values():
                if len(notes) != 1:
                    continue
                note = notes[0]
                rest = note.find(q("rest"))
                duration = note.find(q("duration"))
                value = _positive_int(duration.text if duration is not None else None)
                is_measure_rest = (
                    rest is not None
                    and (rest.get("measure") == "yes" or note.findtext(q("type")) == "whole")
                )
                if not is_measure_rest or value is None or value <= capacity:
                    continue
                duration.text = str(capacity)
                rest.set("measure", "yes")
                report["full_measure_rests_repaired"] += 1
                repaired = True

            if repaired:
                # A backup following the bad voice commonly carries the same
                # impossible value. It must be corrected too or later voices
                # still begin from the wrong cursor position.
                for backup in measure.findall(q("backup")):
                    duration = backup.find(q("duration"))
                    value = _positive_int(duration.text if duration is not None else None)
                    if value is not None and value > capacity:
                        duration.text = str(capacity)
                        report["backups_repaired"] += 1
                report["measures_repaired"].append({
                    "part": part_index,
                    "measure": measure.get("number", str(measure_index)),
                    "capacity": capacity,
                })

    tree.write(path, encoding="utf-8", xml_declaration=True)
    return report
