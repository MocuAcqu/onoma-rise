import os

from tonnze.env_file import load_env_file


def test_loads_env_without_overriding_host_values(tmp_path, monkeypatch):
    path = tmp_path / ".env"
    path.write_text(
        "# comment\nNEW_SETTING='from file'\nEXISTING_SETTING=from-file\n",
        encoding="utf-8",
    )
    monkeypatch.setenv("EXISTING_SETTING", "from-host")
    monkeypatch.delenv("NEW_SETTING", raising=False)

    load_env_file(path)

    assert os.environ["NEW_SETTING"] == "from file"
    assert os.environ["EXISTING_SETTING"] == "from-host"
