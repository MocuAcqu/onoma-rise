"""Single entry point for OCR and MusicXML text interpretation."""
from __future__ import annotations

from tonnze.rules.dynamics import DYNAMIC_PATTERN, DYNAMIC_RULES, DYNAMIC_VELOCITY
from tonnze.rules.expressions import EXPRESSION_RULES
from tonnze.rules.models import TextRule
from tonnze.rules.tempo import TEMPO_RULES


TEXT_RULES = (*TEMPO_RULES, *DYNAMIC_RULES, *EXPRESSION_RULES)


def recognize_terms(text: str) -> list[TextRule]:
    cleaned = " ".join(text.replace("|", " ").split())
    found: list[TextRule] = []
    for rule in TEXT_RULES:
        if rule.pattern.search(cleaned) and rule.canonical not in {item.canonical for item in found}:
            found.append(rule)
    return found


def recognize_term(text: str) -> TextRule | None:
    """Compatibility helper for callers that need the first semantic rule."""
    rules = recognize_terms(text)
    return rules[0] if rules else None


def _center(box) -> tuple[float, float]:
    return (
        sum(float(point[0]) for point in box) / len(box),
        sum(float(point[1]) for point in box) / len(box),
    )


def _bounds(box) -> tuple[float, float, float, float]:
    xs = [float(point[0]) for point in box]
    ys = [float(point[1]) for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def extract_ocr_terms(rows: list[dict]) -> list[dict]:
    terms: list[dict] = []
    for row in rows:
        text = row["text"].strip()
        rules = recognize_terms(text)
        dynamic = DYNAMIC_PATTERN.search(text) if row["confidence"] >= 0.7 else None
        if not rules and not dynamic:
            continue
        x, y = _center(row["box"])
        left, top, right, bottom = _bounds(row["box"])
        matches = []
        for rule in rules:
            match = rule.pattern.search(text)
            matches.append((
                rule.canonical, rule.kind, rule.bpm, None,
                match.start() if match else 0,
            ))
        if dynamic:
            name = dynamic.group(0).lower()
            matches.append((name, "dynamic", None, DYNAMIC_VELOCITY[name], dynamic.start()))
        seen: set[tuple[str, str]] = set()
        for canonical, kind, bpm, velocity, character_offset in matches:
            if (canonical, kind) in seen:
                continue
            seen.add((canonical, kind))
            # A row such as "p dolce" contains two directions. Preserve their
            # left-to-right order instead of rendering both at the row centre.
            anchor_x = left + (right - left) * character_offset / max(1, len(text))
            item = {
                "text": canonical, "raw": text, "kind": kind,
                "confidence": round(float(row["confidence"]), 4),
                "x": round(x, 2), "y": round(y, 2),
                "anchor_x": round(anchor_x, 2),
                "box": [round(left, 2), round(top, 2), round(right, 2), round(bottom, 2)],
                "source": "ocr",
            }
            if bpm:
                item["bpm"] = bpm
            if velocity is not None:
                item["velocity"] = velocity
            terms.append(item)

    unique: list[dict] = []
    for term in terms:
        duplicate = next((
            item for item in unique
            if item["text"].lower() == term["text"].lower()
            and abs(item["x"] - term["x"]) <= 20
            and abs(item["y"] - term["y"]) <= 20
        ), None)
        if duplicate is None:
            unique.append(term)
        elif term["confidence"] > duplicate["confidence"]:
            unique[unique.index(duplicate)] = term
    return sorted(unique, key=lambda item: (item["y"], item["x"]))
