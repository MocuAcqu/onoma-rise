"""Merge recognized semantics into MusicXML without rewriting its notation."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path

from tonnze.recognition.geometry import ScoreGeometry, analyze_score_geometry
from tonnze.rules.dynamics import DYNAMIC_VELOCITY
from tonnze.rules.registry import extract_ocr_terms, recognize_term


def _namespace(root: ET.Element):
    match = re.match(r"\{(.+)}", root.tag)
    uri = match.group(1) if match else None
    if uri:
        ET.register_namespace("", uri)
    return lambda tag: f"{{{uri}}}{tag}" if uri else tag


def _system_groups(measures, q) -> list[list[tuple[int, ET.Element]]]:
    groups: list[list[tuple[int, ET.Element]]] = []
    for index, measure in enumerate(measures):
        printed = measure.find(q("print"))
        if not groups or (printed is not None and printed.get("new-system") == "yes"):
            groups.append([])
        groups[-1].append((index, measure))
    return groups


def _measure_for_position(
    measures, q, x: float, y: float, width: float, height: float,
    kind: str, geometry: ScoreGeometry | None,
) -> tuple[int, ET.Element, float, str, int, int]:
    """Map page coordinates to system, measure, measure fraction and lane."""
    groups = _system_groups(measures, q)
    if geometry and len(geometry.systems) == len(groups):
        system = geometry.nearest_system(y)
        slot, fraction = system.locate_x(x)
        index, measure = groups[system.index][min(slot, len(groups[system.index]) - 1)]
        placement, staff = system.direction_lane(y, kind)
        return index, measure, fraction, placement, staff, system.index
    vertical = min(0.999, max(0.0, (y / max(height, 1) - 0.04) / 0.92))
    system_index = min(len(groups) - 1, int(vertical * len(groups)))
    group = groups[system_index]
    horizontal = min(0.999, max(0.0, (x / max(width, 1) - 0.04) / 0.92))
    slot = min(len(group) - 1, int(horizontal * len(group)))
    fraction = horizontal * len(group) - slot
    placement = "above" if kind in {"tempo", "restore_tempo", "section"} else "below"
    index, measure = group[slot]
    return index, measure, fraction, placement, 1, system_index


def _measure_timings(measures, q) -> list[dict]:
    divisions = 1
    time_units = 4
    timings = []
    for measure in measures:
        visual_attributes = False
        for attributes in measure.findall(q("attributes")):
            value = attributes.findtext(q("divisions"))
            if value:
                divisions = max(1, int(value))
            time = attributes.find(q("time"))
            if time is not None:
                beats = int(time.findtext(q("beats"), default="4"))
                beat_type = int(time.findtext(q("beat-type"), default="4"))
                time_units = round(beats * 4 / beat_type * divisions)
            if any(attributes.find(q(name)) is not None for name in ("clef", "key", "time")):
                visual_attributes = True

        cursor = 0
        furthest = 0
        last_onset = 0
        onsets: set[int] = set()
        directions: list[tuple[ET.Element, int]] = []
        for child in list(measure):
            tag = child.tag.rsplit("}", 1)[-1]
            if tag == "note":
                duration = int(child.findtext(q("duration"), default="0") or 0)
                if child.find(q("chord")) is None:
                    last_onset = cursor
                    if duration:
                        onsets.add(cursor)
                        cursor += duration
                elif duration:
                    onsets.add(last_onset)
                furthest = max(furthest, cursor, last_onset + duration)
            elif tag == "backup":
                cursor = max(0, cursor - int(child.findtext(q("duration"), default="0") or 0))
            elif tag == "forward":
                cursor += int(child.findtext(q("duration"), default="0") or 0)
                furthest = max(furthest, cursor)
            elif tag == "direction":
                explicit = int(child.findtext(q("offset"), default="0") or 0)
                directions.append((child, max(0, cursor + explicit)))
        timings.append({
            "divisions": divisions,
            "duration": max(1, furthest or time_units),
            "onsets": sorted(onsets) or [0],
            "directions": directions,
            "visual_attributes": visual_attributes,
        })
    return timings


def _snap_offset(timing: dict, fraction: float) -> int:
    # Clef/key/time consume horizontal room without consuming musical time.
    # Remove that leading engraving area before converting x to a beat.
    if timing["visual_attributes"]:
        fraction = max(0.0, (fraction - 0.14) / 0.86)
    raw = fraction * timing["duration"]
    return min(timing["onsets"], key=lambda onset: abs(onset - raw))


def _add_sound(direction: ET.Element, q, bpm: float) -> None:
    sound = direction.find(q("sound"))
    if sound is None:
        sound = ET.SubElement(direction, q("sound"))
    sound.set("tempo", f"{bpm:g}")


def _append_direction(
    measure: ET.Element, q, term: dict, initial_bpm: float, offset: int
) -> None:
    direction = ET.Element(q("direction"), {"placement": term["placement"]})
    direction_type = ET.SubElement(direction, q("direction-type"))
    if term["kind"] == "dynamic":
        dynamics = ET.SubElement(direction_type, q("dynamics"))
        ET.SubElement(dynamics, q(term["text"]))
    elif term["kind"] == "section" and term["text"] == "Coda":
        ET.SubElement(direction_type, q("coda"))
    elif term["kind"] == "section":
        ET.SubElement(direction_type, q("rehearsal")).text = term["text"]
    else:
        ET.SubElement(direction_type, q("words")).text = term["text"]
    if offset:
        ET.SubElement(direction, q("offset"), {"sound": "yes"}).text = str(offset)
    ET.SubElement(direction, q("staff")).text = str(term["staff"])
    if term.get("bpm"):
        _add_sound(direction, q, term["bpm"])
    elif term["kind"] == "dynamic":
        sound = ET.SubElement(direction, q("sound"))
        sound.set("dynamics", f"{round(term['velocity'] * 127):g}")
    elif term["kind"] == "restore_tempo":
        _add_sound(direction, q, initial_bpm)
    children = list(measure)
    insert_at = next((
        index for index, child in enumerate(children)
        if child.tag.rsplit("}", 1)[-1] in {"note", "backup", "forward", "barline"}
    ), len(children))
    measure.insert(insert_at, direction)


def enrich_musicxml(
    source: Path,
    target: Path,
    ocr_rows: list[dict],
    page_height: int,
    page_width: int | None = None,
    score_image: Path | None = None,
) -> list[dict]:
    tree = ET.parse(source)
    root = tree.getroot()
    q = _namespace(root)
    first_part = root.find(q("part"))
    if first_part is None:
        raise ValueError("MusicXML 缺少聲部。")
    measures = first_part.findall(q("measure"))
    if not measures:
        raise ValueError("MusicXML 缺少小節。")
    groups = _system_groups(measures, q)
    geometry = analyze_score_geometry(score_image, [len(group) for group in groups])
    timings = _measure_timings(measures, q)

    terms = []
    initial_bpm = 120.0
    existing_positions: set[tuple[str, int]] = set()
    open_wedges: dict[str, dict] = {}
    for measure_index, measure in enumerate(measures):
        timing = timings[measure_index]
        for direction, direction_offset in timing["directions"]:
            beat_offset = direction_offset / timing["divisions"]
            placement = direction.get("placement", "above")
            staff = int(direction.findtext(q("staff"), default="1") or 1)
            for words in direction.findall(f".//{q('words')}"):
                text = (words.text or "").strip()
                rule = recognize_term(text)
                if not rule:
                    continue
                existing_positions.add((rule.canonical.lower(), measure_index + 1))
                term = {
                    "text": rule.canonical, "raw": text, "kind": rule.kind,
                    "source": "homr", "measure": measure_index + 1,
                    "beat_offset": beat_offset, "placement": placement, "staff": staff,
                }
                if rule.bpm:
                    term["bpm"] = rule.bpm
                    if not any(item.get("bpm") for item in terms):
                        initial_bpm = rule.bpm
                    _add_sound(direction, q, rule.bpm)
                elif rule.kind == "restore_tempo":
                    _add_sound(direction, q, initial_bpm)
                terms.append(term)
            for dynamics in direction.findall(f".//{q('dynamics')}"):
                for symbol in list(dynamics):
                    name = symbol.tag.rsplit("}", 1)[-1].lower()
                    if name not in DYNAMIC_VELOCITY:
                        continue
                    term = {
                        "text": name, "raw": name, "kind": "dynamic",
                        "velocity": DYNAMIC_VELOCITY[name], "source": "homr",
                        "measure": measure_index + 1, "beat_offset": beat_offset,
                        "placement": placement, "staff": staff,
                    }
                    if (name, measure_index + 1) not in existing_positions:
                        terms.append(term)
                        existing_positions.add((name, measure_index + 1))
            for wedge in direction.findall(f".//{q('wedge')}"):
                wedge_type = wedge.get("type", "")
                number = wedge.get("number", "1")
                if wedge_type in {"crescendo", "diminuendo"}:
                    term = {
                        "text": "cresc." if wedge_type == "crescendo" else "dim.",
                        "raw": wedge_type,
                        "kind": "gradual_louder" if wedge_type == "crescendo" else "gradual_softer",
                        "source": "homr", "measure": measure_index + 1,
                        "beat_offset": beat_offset, "placement": placement, "staff": staff,
                    }
                    terms.append(term)
                    open_wedges[number] = term
                elif wedge_type == "stop" and number in open_wedges:
                    started = open_wedges.pop(number)
                    started["end_measure"] = measure_index + 1
                    started["end_beat_offset"] = beat_offset

    ocr_terms = extract_ocr_terms(ocr_rows)
    first_explicit_tempo = next(
        (term["bpm"] for term in ocr_terms if term.get("bpm")), initial_bpm
    )
    if not terms:
        initial_bpm = first_explicit_tempo
    for term in ocr_terms:
        # The first explicit tempo normally belongs to measure one even when a
        # title block makes its page y-coordinate look lower.
        if term.get("bpm") and not any(item.get("bpm") for item in terms):
            measure_index, measure = 0, measures[0]
            fraction, placement, staff, system_index = 0.0, "above", 1, 0
        else:
            measure_index, measure, fraction, placement, staff, system_index = _measure_for_position(
                measures, q, term.get("anchor_x", term["x"]), term["y"],
                page_width or page_height, page_height, term["kind"], geometry,
            )
        timing = timings[measure_index]
        offset = _snap_offset(timing, fraction)
        term["measure"] = measure_index + 1
        term["system"] = system_index + 1
        term["beat_offset"] = round(offset / timing["divisions"], 6)
        term["placement"] = placement
        term["staff"] = staff
        position = (term["text"].lower(), term["measure"])
        if position in existing_positions:
            continue
        _append_direction(measure, q, term, initial_bpm, offset)
        terms.append(term)
        existing_positions.add(position)

    tree.write(target, encoding="utf-8", xml_declaration=True)
    return terms
