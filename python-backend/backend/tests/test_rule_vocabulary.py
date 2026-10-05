from tonnze.rules.registry import contains_music_text, recognize_terms


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
