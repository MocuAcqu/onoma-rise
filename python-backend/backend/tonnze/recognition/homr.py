"""Run HOMR in an isolated directory and locate its MusicXML output."""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def recognize(image: Path, work: Path, executable: str) -> Path:
    # The worker may receive a relative data directory. homr runs with its own
    # output directory as cwd, so all paths passed across that boundary must be
    # absolute or they would be resolved twice (homr/data/.../homr/data/...).
    image = image.resolve()
    engine_dir = (work / "homr").resolve()
    engine_dir.mkdir(exist_ok=True)
    engine_input = engine_dir / "page.png"
    shutil.copyfile(image, engine_input)
    command = [executable, str(engine_input)]
    try:
        process = subprocess.Popen(
            command,
            cwd=engine_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
    except FileNotFoundError as error:
        raise RuntimeError("找不到 homr，請先執行 ./setup-local.sh。") from error
    assert process.stdout is not None
    for line in process.stdout:
        print("[homr] " + line, end="", flush=True)
    if process.wait() != 0:
        raise RuntimeError("homr 辨識失敗，請查看工作日誌或改用較清晰的樂譜。")
    outputs = sorted(engine_dir.glob("*.musicxml")) + sorted(engine_dir.glob("*.mxl"))
    if len(outputs) != 1:
        raise RuntimeError("homr 沒有產生單一 MusicXML 結果。")
    return outputs[0]
