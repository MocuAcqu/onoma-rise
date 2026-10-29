"""Load and validate the versioned music-term catalogue."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from tonnze.rules.models import TextRule


CATALOG_PATH = Path(__file__).with_name("music_terms.json")
_REQUIRED_TERM_FIELDS = {
    "id", "family", "canonical", "aliases", "kind",
    "meaningZh", "playback", "referenceIds",
}


def _alias_pattern(aliases: list[str]) -> str:
    """Build a Unicode-safe token matcher from readable catalogue aliases."""
    alternatives = []
    for alias in sorted(aliases, key=len, reverse=True):
        words = [re.escape(part) for part in alias.strip().split()]
        alternatives.append(r"\s+".join(words))
    return rf"(?<!\w)(?:{'|'.join(alternatives)})(?!\w)"


def validate_catalog(catalog: dict) -> None:
    """Fail at startup when catalogue edits are incomplete or ambiguous."""
    if catalog.get("schemaVersion") != 1:
        raise ValueError("music_terms.json schemaVersion 必須為 1。")
    references = catalog.get("references")
    terms = catalog.get("terms")
    if not isinstance(references, dict) or not isinstance(terms, list):
        raise ValueError("music_terms.json 缺少 references 或 terms。")

    seen_ids: set[str] = set()
    seen_aliases: dict[tuple[str, str], str] = {}
    for index, term in enumerate(terms):
        missing = _REQUIRED_TERM_FIELDS - term.keys()
        if missing:
            raise ValueError(f"術語第 {index + 1} 筆缺少欄位：{sorted(missing)}")
        term_id = term["id"]
        if term_id in seen_ids:
            raise ValueError(f"術語 ID 重複：{term_id}")
        seen_ids.add(term_id)
        if not term["aliases"]:
            raise ValueError(f"術語缺少 aliases：{term_id}")
        for alias in term["aliases"]:
            alias_key = (term["family"], " ".join(alias.lower().split()))
            previous = seen_aliases.get(alias_key)
            if previous:
                raise ValueError(f"術語別名重複：{alias!r} 同時出現在 {previous} 與 {term_id}")
            seen_aliases[alias_key] = term_id
        unknown = set(term["referenceIds"]) - references.keys()
        if unknown:
            raise ValueError(f"術語 {term_id} 使用未知來源：{sorted(unknown)}")
        re.compile(term.get("pattern") or _alias_pattern(term["aliases"]), re.IGNORECASE)

        playback = term["playback"]
        if term["kind"] == "tempo" and not isinstance(playback.get("bpm"), (int, float)):
            raise ValueError(f"速度術語缺少 bpm：{term_id}")
        if term["family"] == "dynamic_mark":
            velocity = playback.get("velocity")
            if not isinstance(velocity, (int, float)) or not 0 <= velocity <= 1:
                raise ValueError(f"力度術語 velocity 必須介於 0 到 1：{term_id}")
        if term["kind"] == "expression":
            if not {"gate", "velocityDelta"} <= playback.keys():
                raise ValueError(f"表情術語缺少 gate 或 velocityDelta：{term_id}")


@lru_cache(maxsize=1)
def load_catalog() -> dict:
    with CATALOG_PATH.open(encoding="utf-8") as source:
        catalog = json.load(source)
    validate_catalog(catalog)
    return catalog


def catalog_terms(*, family: str | None = None, kind: str | None = None) -> list[dict]:
    terms = load_catalog()["terms"]
    return [
        term for term in terms
        if (family is None or term["family"] == family)
        and (kind is None or term["kind"] == kind)
    ]


def text_rules(family: str) -> tuple[TextRule, ...]:
    """Compile data-only catalogue rows into the existing rule-engine API."""
    return tuple(
        TextRule(
            re.compile(term.get("pattern") or _alias_pattern(term["aliases"]), re.IGNORECASE),
            term["canonical"],
            term["kind"],
            term["playback"].get("bpm"),
        )
        for term in catalog_terms(family=family)
    )


def setting(name: str):
    return load_catalog()["settings"][name]
