import xml.etree.ElementTree as ET

from tonnze.rules.measure_timing import normalize_measure_timing


def write_score(tmp_path, measure, *, beats=2, beat_type=4, divisions=4):
    path = tmp_path / "score.musicxml"
    path.write_text(
        f'''<?xml version="1.0"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>{divisions}</divisions></attributes>
      <attributes><time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time></attributes>
      {measure}
    </measure>
  </part>
</score-partwise>''',
        encoding="utf-8",
    )
    return path


def test_repairs_overlong_measure_rest_and_matching_backup(tmp_path):
    path = write_score(tmp_path, '''
      <note><rest/><duration>16</duration><voice>5</voice><type>whole</type><staff>2</staff></note>
      <backup><duration>16</duration></backup>
      <note><pitch><step>A</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>eighth</type><staff>1</staff></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>eighth</type><staff>1</staff></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>eighth</type><staff>1</staff></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><voice>1</voice><type>eighth</type><staff>1</staff></note>
    ''')

    report = normalize_measure_timing(path)
    root = ET.parse(path).getroot()

    assert root.findtext(".//note[rest]/duration") == "8"
    assert root.find(".//note/rest").get("measure") == "yes"
    assert root.findtext(".//backup/duration") == "8"
    assert report["full_measure_rests_repaired"] == 1
    assert report["backups_repaired"] == 1
    assert report["measures_repaired"] == [
        {"part": 1, "measure": "1", "capacity": 8}
    ]


def test_keeps_valid_four_four_measure_rest(tmp_path):
    path = write_score(
        tmp_path,
        '<note><rest/><duration>16</duration><voice>1</voice><type>whole</type></note>',
        beats=4,
    )

    report = normalize_measure_timing(path)

    assert ET.parse(path).getroot().findtext(".//note/duration") == "16"
    assert report["full_measure_rests_repaired"] == 0


def test_does_not_change_implicit_pickup_measure(tmp_path):
    path = write_score(
        tmp_path,
        '<note><rest/><duration>16</duration><voice>1</voice><type>whole</type></note>',
    )
    tree = ET.parse(path)
    tree.getroot().find(".//measure").set("implicit", "yes")
    tree.write(path, encoding="utf-8", xml_declaration=True)

    normalize_measure_timing(path)

    assert ET.parse(path).getroot().findtext(".//note/duration") == "16"
