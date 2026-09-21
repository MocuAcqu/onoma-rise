"""Single local worker that runs each recognition job in a cancellable process."""
from __future__ import annotations

import sys
import codecs
import builtins

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    except Exception:
        pass

if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception:
        pass

old_open = builtins.open
def utf8_open(*args, **kwargs):
    # 檢查 mode 是否包含 'b'（例如 'rb', 'wb' 二進位模式），如果是就原封不動交給原本的 open
    mode = kwargs.get('mode', 'r')
    if len(args) > 1:
        mode = args[1]
    
    if 'b' not in mode:
        if 'encoding' not in kwargs:
            kwargs['encoding'] = 'utf-8'
            
    return old_open(*args, **kwargs)

builtins.open = utf8_open

if sys.platform != "win32":
    import fcntl
else:
    fcntl = None
    
import json
import logging
import os
import shutil
import signal
import subprocess
import sys
import time

from tonnze.repositories import jobs
from tonnze.config import DATA, JOB_TIMEOUT

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
stopping = False


def on_stop(signum, frame) -> None:
    global stopping
    stopping = True


def terminate(process: subprocess.Popen) -> None:
    try:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait(timeout=3)
    except ProcessLookupError:
        process.wait()


def cleanup(db) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    for job_id in jobs.delete_expired(db):
        shutil.rmtree(DATA / job_id, ignore_errors=True)


def _events(lines, db, job_id, failure: str) -> str:
    for line in lines:
        if not line.startswith("SCORE_EVENT "):
            continue
        message = json.loads(line[len("SCORE_EVENT "):])
        if "error" in message:
            failure = message["error"]
        else:
            jobs.change(db, job_id, allowed={"running"}, **message)
    return failure


def process_job(db, job_id: str) -> None:
    current = jobs.get_job(db, job_id)
    if not current or current["status"] != "running":
        return
    work = DATA / job_id
    process = None
    failure = "辨識失敗，請換一份清晰的樂譜重試。"
    try:
        log_path = work / "worker.log"
        with log_path.open("w") as output:
            process = subprocess.Popen(
                [sys.executable, "-u", "-m", "tonnze.services.score_recognition", str(work)],
                stdout=output,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        started = time.monotonic()
        pending = ""
        with log_path.open(encoding="utf-8", errors="replace") as log:
            while True:
                jobs.heartbeat(db)
                current = jobs.get_job(db, job_id)
                if stopping or not current or current["status"] == "cancelling":
                    terminate(process)
                    jobs.change(
                        db, job_id, allowed={"running", "cancelling"}, status="cancelled",
                        stage="已取消", finished_at=time.time(),
                    )
                    return
                if time.monotonic() - started > JOB_TIMEOUT:
                    terminate(process)
                    raise TimeoutError(
                        f"辨識超過 {JOB_TIMEOUT // 60} 分鐘，請縮小圖片或換一份樂譜重試。"
                    )
                pending += log.read(65536)
                lines = pending.split("\n")
                pending = lines.pop()
                failure = _events(lines, db, job_id, failure)
                if process.poll() is not None:
                    failure = _events((pending + log.read()).splitlines(), db, job_id, failure)
                    break
                time.sleep(0.25)
        if process.returncode:
            log_path = work / "worker.log"
            if log_path.exists():
                print("--- 以下是子行程的真實報錯記錄 ---")
                print(log_path.read_text(encoding="utf-8", errors="replace"))
                print("------------------------------------")
            raise ValueError(failure)
        metadata = json.loads((work / "result.json").read_text(encoding="utf-8"))
        public_metadata = {
            key: metadata[key]
            for key in ("note_count", "bpm", "engines", "terms", "piano", "warnings")
            if key in metadata
        }
        final = jobs.change(
            db, job_id, allowed={"running"}, status="complete", percent=100,
            stage="辨識完成", finished_at=time.time(), **public_metadata,
        )
        if final and final["status"] == "cancelling":
            jobs.change(
                db, job_id, allowed={"cancelling"}, status="cancelled",
                stage="已取消", finished_at=time.time(),
            )
    except Exception as error:
        logging.exception("Job %s failed", job_id)
        if process and process.poll() is None:
            terminate(process)
        current = jobs.get_job(db, job_id)
        cancelled = current and current["status"] == "cancelling"
        jobs.change(
            db, job_id, allowed={"running", "cancelling"},
            status="cancelled" if cancelled else "failed",
            stage="已取消" if cancelled else "辨識失敗",
            error=None if cancelled else str(error), finished_at=time.time(),
        )
    finally:
        if work.exists():
            os.utime(work, None)


def main() -> None:
    global stopping
    signal.signal(signal.SIGTERM, on_stop)
    signal.signal(signal.SIGINT, on_stop)
    DATA.mkdir(parents=True, exist_ok=True)
    # A non-blocking OS lock is simpler and safer than a network lease locally.
    lock = (DATA / ".worker.lock").open("w")
    try:
        if fcntl:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit("已存在另一個背景 worker 正在運行中")
    db = jobs.connection()
    jobs.recover_interrupted(db)
    last_cleanup = 0.0
    logging.info("homr local worker ready")
    while not stopping:
        jobs.heartbeat(db)
        if time.monotonic() - last_cleanup > 60:
            cleanup(db)
            last_cleanup = time.monotonic()
        job = jobs.claim_next(db)
        if job:
            process_job(db, job["id"])
        else:
            time.sleep(0.5)


if __name__ == "__main__":
    main()
