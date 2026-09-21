"""Dynamic levels and gradual dynamic terminology."""
from __future__ import annotations

import re

from tonnze.rules.models import text_rule


DYNAMIC_RULES = (
    text_rule(r"\b(?:crescendo|cresc)\.?\b", "cresc.", "gradual_louder"),
    text_rule(r"\b(?:diminuendo|dim|decrescendo|decresc)\.?\b", "dim.", "gradual_softer"),
)

# MusicXML permits more extremes, but these values keep audible headroom and
# avoid mapping quiet markings to silence.
DYNAMIC_VELOCITY = {
    "pppp": 0.16, "ppp": 0.22, "pp": 0.30, "p": 0.40,
    "mp": 0.52, "mf": 0.64, "f": 0.76, "ff": 0.88,
    "fff": 0.96, "ffff": 1.0, "fp": 0.68, "sf": 0.90,
    "sfz": 0.94, "sfp": 0.86, "rf": 0.90, "rfz": 0.94,
}

# Text-only crescendo/diminuendo without a following explicit dynamic uses a
# small but clearly audible fallback change. Explicit targets always win.
DEFAULT_DYNAMIC_RAMP = 0.195

DYNAMIC_PATTERN = re.compile(
    # `[^\W\d_]` is a Unicode-aware letter class. ASCII-only boundaries
    # incorrectly extracted `f` from German `für das Pianoforte`.
    r"(?<![^\W\d_])(?:pppp|ppp|pp|mp|mf|ffff|fff|ff|sfp|sfz|sf|rfz|rf|fp|p|f)(?![^\W\d_])",
    re.IGNORECASE,
)
