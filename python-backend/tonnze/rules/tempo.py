"""Absolute, relative and gradual tempo terminology."""
from tonnze.rules.vocabulary import text_rules


# Compatibility export: callers keep a typed rule tuple while the vocabulary
# itself now has one editable source of truth in music_terms.json.
TEMPO_RULES = text_rules("tempo")
