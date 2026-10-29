from music21 import converter

from tonnze.rules.performance import performance_events
from tonnze.rules.registry import contains_music_text, recognize_terms
from tonnze.rules.vocabulary import load_catalog, validate_catalog


def test_risoluto_is_a_recognized_expression() -> None:
    rules = recognize_terms("Risoluto")
    assert [(rule.canonical, rule.kind) for rule in rules] == [
        ("risoluto", "expression"),
    ]


def test_navigation_terms_are_recognized() -> None:
    expected = {
        "D.C. al Fine": ("D.C.", "da_capo"),
        "D.S. al Coda": ("D.S.", "dal_segno"),
        "To Coda": ("To Coda", "to_coda"),
        "Segno": ("Segno", "segno"),
    }
    for text, result in expected.items():
        rules = recognize_terms(text)
        assert (rules[0].canonical, rules[0].kind) == result
        assert contains_music_text(text)


def test_registry_is_the_shared_music_vocabulary() -> None:
    for text in ("sostenuto", "più mosso", "Fine", "ffff"):
        assert contains_music_text(text)
    assert not contains_music_text("ordinary prose")


def test_catalog_has_unique_ids_and_resolved_references() -> None:
    catalog = load_catalog()
    validate_catalog(catalog)
    ids = [term["id"] for term in catalog["terms"]]
    assert len(ids) == len(set(ids))
    assert all(term["referenceIds"] for term in catalog["terms"])


def test_catalog_preserves_aliases_and_playback_policy() -> None:
    catalog = load_catalog()
    by_id = {term["id"]: term for term in catalog["terms"]}
    assert "rallentando" in by_id["tempo.ritardando"]["aliases"]
    assert by_id["tempo.allegro"]["playback"]["bpm"] == 120
    assert by_id["dynamic.mf"]["playback"]["velocity"] == 0.64
    assert by_id["expression.dolce"]["playback"] == {
        "gate": 0.98,
        "velocityDelta": -0.08,
    }
    assert catalog["settings"]["defaultDynamicRamp"] == 0.28


def test_double_barline_restarts_dynamic_calculation() -> None:
    xml = """<?xml version="1.0"?>
    <score-partwise version="4.0">
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
          <barline location="right"><bar-style>light-light</bar-style></barline>
        </measure>
        <measure number="2">
          <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
        </measure>
      </part>
    </score-partwise>"""
    score = converter.parseData(xml, format="musicxml")
    events = performance_events(score, [{
        "kind": "gradual_louder", "text": "cresc.", "measure": 1,
        # Even with only one beat left, the full crescendo must finish before
        # the double barline instead of being cut off there.
        "beat_offset": 3,
    }])

    assert events[0] == {
        "kind": "dynamic", "curve": "linear", "startBeat": 3.0,
        "endBeat": 4.0, "startValue": 0.64, "endValue": 0.92,
        "label": "cresc.",
    }
    assert events[1] == {
        "kind": "dynamic", "curve": "step", "startBeat": 4.0,
        "endBeat": 4.0, "startValue": 0.64, "endValue": 0.64,
        "label": "section reset",
    }


def test_repeat_barline_restarts_dynamic_calculation() -> None:
    xml = """<?xml version="1.0"?>
    <score-partwise version="4.0">
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
          <barline location="right"><repeat direction="backward"/></barline>
        </measure>
        <measure number="2">
          <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
        </measure>
      </part>
    </score-partwise>"""
    score = converter.parseData(xml, format="musicxml")

    assert performance_events(score, []) == [{
        "kind": "dynamic", "curve": "step", "startBeat": 4.0,
        "endBeat": 4.0, "startValue": 0.64, "endValue": 0.64,
        "label": "section reset",
    }]


def test_every_catalogue_term_is_connected_to_recognition() -> None:
    for term in load_catalog()["terms"]:
        sample = term["aliases"][0]
        if term["family"] == "dynamic_mark":
            assert contains_music_text(sample), term["id"]
            continue
        recognized = {
            (rule.canonical, rule.kind) for rule in recognize_terms(sample)
        }
        assert (term["canonical"], term["kind"]) in recognized, term["id"]
