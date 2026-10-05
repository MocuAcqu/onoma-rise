"""Expression text and structural labels that do not imply an exact BPM."""
from tonnze.rules.models import text_rule


EXPRESSION_RULES = (
    text_rule(r"\b(?:d\.?\s*c\.?|da\s+capo)\b", "D.C.", "da_capo"),
    text_rule(r"\b(?:d\.?\s*s\.?|dal\s+segno)\b", "D.S.", "dal_segno"),
    text_rule(r"\b(?:to|al)\s+coda\b", "To Coda", "to_coda"),
    text_rule(r"\bdolce\b", "dolce", "expression"),
    text_rule(r"\blegato\b", "legato", "expression"),
    text_rule(r"\bcantabile\b", "cantabile", "expression"),
    text_rule(r"\bespressivo\b|\bespr\.?\b", "espressivo", "expression"),
    text_rule(r"\bmarcato\b", "marcato", "expression"),
    text_rule(r"\brisoluto\b", "risoluto", "expression"),
    text_rule(r"\bsostenuto\b", "sostenuto", "expression"),
    text_rule(r"\bcon\s+brio\b", "con brio", "expression"),
    text_rule(r"\brubato\b", "rubato", "expression"),
    text_rule(r"\btrio\b", "Trio", "section"),
    text_rule(r"\bsegno\b", "Segno", "segno"),
    text_rule(r"(?<!to )(?<!al )\bcoda\b", "Coda", "section"),
    text_rule(r"(?<!al )\bfine\b", "Fine", "section"),
)
