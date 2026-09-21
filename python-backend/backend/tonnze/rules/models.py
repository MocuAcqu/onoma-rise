"""Shared immutable rule definitions and score-event value objects."""
from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class TextRule:
    pattern: re.Pattern
    canonical: str
    kind: str
    bpm: float | None = None


def text_rule(pattern: str, canonical: str, kind: str, bpm=None) -> TextRule:
    return TextRule(re.compile(pattern, re.IGNORECASE), canonical, kind, bpm)
