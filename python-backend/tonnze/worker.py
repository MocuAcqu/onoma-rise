"""Single local worker that runs each recognition job in a cancellable process."""
from __future__ import annotations

import sys

if sys.platform != "win32":
    import fcntl
else:
    fcntl = None

import json
import logging
import os
import signal
import subprocess
import time

from tonnze.repositories import jobs
from tonnze.config import DATA, JOB_TIMEOUT
from tonnze.recognition.storage import get_score_storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
stopping = False
PUBLIC_JOB_FAILURE = "辨識失敗，請換一份清晰的樂譜重試。"
storage = get_score_storage()


def on_stop(signum, frame) -> None:
    global stopping
    stopping = True


def terminate(process: subprocess.Popen) -> None:
    try:
        if hasattr(os, "killpg"):
            os.killpg(process.pid, signal.SIGTERM)
        else:
            process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            if hasattr(os, "killpg"):
                os.killpg(process.pid, signal.SIGKILL)
            else:
                process.kill()
            process.wait(timeout=3)
    except ProcessLookupError:
        process.wait()


def cleanup(db) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    for job_id in jobs.delete_expired(db):
        storage.delete_job(job_id)


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
    with storage.work_directory(current) as work:
        process = None
        failure = PUBLIC_JOB_FAILURE
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
                        failure = (
                            f"辨識超過 {JOB_TIMEOUT // 60} 分鐘，請縮小圖片或換一份樂譜重試。"
                        )
                        raise TimeoutError(failure)
                    pending += log.read(65536)
                    lines = pending.split("\n")
                    pending = lines.pop()
                    failure = _events(lines, db, job_id, failure)
                    if process.poll() is not None:
                        failure = _events((pending + log.read()).splitlines(), db, job_id, failure)
                        break
                    time.sleep(0.25)
            if process.returncode:
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
            # Upload every result before exposing status=complete. Download
            # endpoints therefore never observe a completed job with no files.
            storage.publish_results(job_id, work)
            final = jobs.change(
                db, job_id, allowed={"running"}, status="complete", percent=100,
                stage="辨識完成", finished_at=time.time(), **public_metadata,
            )
            if final and final["status"] == "cancelling":
                jobs.change(
                    db, job_id, allowed={"cancelling"}, status="cancelled",
                    stage="已取消", finished_at=time.time(),
                )
        except Exception:
            logging.exception("Job %s failed", job_id)
            if process and process.poll() is None:
                terminate(process)
            current = jobs.get_job(db, job_id)
            cancelled = current and current["status"] == "cancelling"
            jobs.change(
                db, job_id, allowed={"running", "cancelling"},
                status="cancelled" if cancelled else "failed",
                stage="已取消" if cancelled else "辨識失敗",
                error=None if cancelled else failure, finished_at=time.time(),
            )


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
