"""Expression text and structural labels that do not imply an exact BPM."""
from tonnze.rules.vocabulary import catalog_terms, text_rules


EXPRESSION_RULES = text_rules("expression")
EXPRESSION_PLAYBACK = {
    term["canonical"]: term["playback"]
    for term in catalog_terms(family="expression", kind="expression")
}
