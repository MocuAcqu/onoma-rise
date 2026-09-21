"""Absolute, relative and gradual tempo terminology."""
from tonnze.rules.models import text_rule


TEMPO_RULES = (
    text_rule(r"\blarghissimo\b", "Larghissimo", "tempo", 24),
    text_rule(r"\bgrave\b", "Grave", "tempo", 40),
    text_rule(r"\blargo\b", "Largo", "tempo", 50),
    text_rule(r"\blento\b", "Lento", "tempo", 52),
    text_rule(r"\blarghetto\b", "Larghetto", "tempo", 60),
    text_rule(r"\badagio\b", "Adagio", "tempo", 66),
    text_rule(r"\badagietto\b", "Adagietto", "tempo", 72),
    text_rule(r"\bandante\b", "Andante", "tempo", 80),
    text_rule(r"\bandantino\b", "Andantino", "tempo", 84),
    text_rule(r"\bmaestoso\b", "Maestoso", "tempo", 88),
    text_rule(r"\bmoderato\b", "Moderato", "tempo", 100),
    text_rule(r"\ballegretto\b", "Allegretto", "tempo", 108),
    text_rule(r"\bbright(?:ly)?\b", "Brightly", "tempo", 116),
    text_rule(r"\ballegro\b", "Allegro", "tempo", 120),
    text_rule(r"\bvivace\b", "Vivace", "tempo", 144),
    text_rule(r"\bpresto\b", "Presto", "tempo", 168),
    text_rule(r"\bprestissimo\b", "Prestissimo", "tempo", 192),
    text_rule(r"\ba\s*tempo\b", "a tempo", "restore_tempo"),
    text_rule(r"\btempo\s+primo\b", "Tempo primo", "restore_tempo"),
    text_rule(r"\b(?:rit|ritardando|rall|rallentando)\.?\b", "rit.", "gradual_slow"),
    text_rule(r"\b(?:accelerando|accel)\.?\b", "accel.", "gradual_fast"),
    text_rule(r"\bpi[uù]\s+mosso\b", "più mosso", "relative_fast"),
    text_rule(r"\bmeno\s+mosso\b", "meno mosso", "relative_slow"),
    text_rule(r"\bstringendo\b", "stringendo", "gradual_fast"),
    text_rule(r"\ballargando\b", "allargando", "broaden"),
    text_rule(r"\b(?:calando|morendo|smorzando)\b", "calando", "fade"),
)
