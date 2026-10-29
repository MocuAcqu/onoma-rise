"""Dynamic levels and gradual dynamic terminology."""
from __future__ import annotations

import re

from tonnze.rules.vocabulary import catalog_terms, setting, text_rules


DYNAMIC_RULES = text_rules("dynamic_direction")

# MusicXML permits more extremes, but these values keep audible headroom and
# avoid mapping quiet markings to silence.
DYNAMIC_VELOCITY = {
    term["canonical"].lower(): term["playback"]["velocity"]
    for term in catalog_terms(family="dynamic_mark")
}

# Text-only crescendo/diminuendo without a following explicit dynamic uses a
# small but clearly audible fallback change. Explicit targets always win.
DEFAULT_DYNAMIC_RAMP = float(setting("defaultDynamicRamp"))

DYNAMIC_PATTERN = re.compile(
    # `[^\W\d_]` is a Unicode-aware letter class. ASCII-only boundaries
    # incorrectly extracted `f` from German `für das Pianoforte`.
    r"(?<![^\W\d_])(?:"
    + "|".join(sorted(map(re.escape, DYNAMIC_VELOCITY), key=len, reverse=True))
    + r")(?![^\W\d_])",
    re.IGNORECASE,
)
