"""Expression text and structural labels that do not imply an exact BPM."""
from tonnze.rules.models import text_rule


EXPRESSION_RULES = (
    text_rule(r"\bdolce\b", "dolce", "expression"),
    text_rule(r"\blegato\b", "legato", "expression"),
    text_rule(r"\bcantabile\b", "cantabile", "expression"),
    text_rule(r"\bespressivo\b|\bespr\.?\b", "espressivo", "expression"),
    text_rule(r"\bmarcato\b", "marcato", "expression"),
    text_rule(r"\bsostenuto\b", "sostenuto", "expression"),
    text_rule(r"\bcon\s+brio\b", "con brio", "expression"),
    text_rule(r"\brubato\b", "rubato", "expression"),
    text_rule(r"\btrio\b", "Trio", "section"),
    text_rule(r"\bcoda\b", "Coda", "section"),
    text_rule(r"\bfine\b", "Fine", "section"),
)
