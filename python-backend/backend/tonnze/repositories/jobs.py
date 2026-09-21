"""Durable SQLite job repository shared by the API and local worker."""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from functools import wraps
from pathlib import Path

from tonnze.config import DATABASE, MAX_QUEUE, RETENTION, TERMINAL, WORKER_STALE_SECONDS

_LOCK = threading.RLock()


def _serialized(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        with _LOCK:
            return function(*args, **kwargs)
    return wrapped


def connection(path: Path | str | None = None) -> sqlite3.Connection:
    database = Path(path or DATABASE)
    database.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(database, timeout=10, check_same_thread=False, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA busy_timeout=10000")
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            created_at REAL NOT NULL,
            status TEXT,
            finished_at REAL
        );
        CREATE TABLE IF NOT EXISTS runtime (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    )
    columns = {row["name"] for row in db.execute("PRAGMA table_info(jobs)")}
    if "status" not in columns:
        db.execute("ALTER TABLE jobs ADD COLUMN status TEXT")
    if "finished_at" not in columns:
        db.execute("ALTER TABLE jobs ADD COLUMN finished_at REAL")
    for row in db.execute("SELECT id, payload FROM jobs WHERE status IS NULL"):
        payload = json.loads(row["payload"])
        db.execute(
            "UPDATE jobs SET status = ?, finished_at = ? WHERE id = ?",
            (payload.get("status"), payload.get("finished_at"), row["id"]),
        )
    db.execute("CREATE INDEX IF NOT EXISTS jobs_status_created ON jobs(status, created_at)")
    db.execute("CREATE INDEX IF NOT EXISTS jobs_expiry ON jobs(status, finished_at)")
    return db


def _load(row) -> dict | None:
    return json.loads(row["payload"]) if row else None


def get_job(db: sqlite3.Connection, job_id: str) -> dict | None:
    return _load(db.execute("SELECT payload FROM jobs WHERE id = ?", (job_id,)).fetchone())


@_serialized
def create_job(db: sqlite3.Connection, job_id: str, filename: str, suffix: str) -> dict:
    job = dict(
        id=job_id, filename=filename, suffix=suffix, status="queued", percent=0,
        stage="等待辨識", created_at=time.time(), started_at=None, finished_at=None,
        error=None, note_count=None, duration=None, bpm=None, engines=None, terms=None,
        warnings=[],
    )
    db.execute("BEGIN IMMEDIATE")
    try:
        queued = db.execute("SELECT COUNT(*) FROM jobs WHERE status = 'queued'").fetchone()[0]
        if queued >= MAX_QUEUE:
            raise ValueError("目前排隊人數較多，請稍後再試。")
        db.execute(
            "INSERT INTO jobs(id, payload, created_at, status, finished_at) VALUES (?, ?, ?, ?, ?)",
            (job_id, json.dumps(job, ensure_ascii=False), job["created_at"], "queued", None),
        )
        db.execute("COMMIT")
        return job
    except Exception:
        db.execute("ROLLBACK")
        raise


@_serialized
def change(db: sqlite3.Connection, job_id: str, allowed=None, **fields) -> dict | None:
    db.execute("BEGIN IMMEDIATE")
    try:
        job = get_job(db, job_id)
        if not job or (allowed is not None and job["status"] not in allowed):
            db.execute("COMMIT")
            return job
        if "percent" in fields:
            fields["percent"] = max(job["percent"], fields["percent"])
        job.update(fields)
        db.execute(
            "UPDATE jobs SET payload = ?, status = ?, finished_at = ? WHERE id = ?",
            (json.dumps(job, ensure_ascii=False), job["status"], job.get("finished_at"), job_id),
        )
        db.execute("COMMIT")
        return job
    except Exception:
        db.execute("ROLLBACK")
        raise


@_serialized
def claim_next(db: sqlite3.Connection) -> dict | None:
    """Atomically claim the oldest queued job."""
    db.execute("BEGIN IMMEDIATE")
    try:
        job = _load(db.execute(
            "SELECT payload FROM jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1"
        ).fetchone())
        if job:
            job.update(status="running", percent=1, stage="準備辨識", started_at=time.time())
            db.execute(
                "UPDATE jobs SET payload = ?, status = 'running' WHERE id = ?",
                (json.dumps(job, ensure_ascii=False), job["id"]),
            )
        db.execute("COMMIT")
        return job
    except Exception:
        db.execute("ROLLBACK")
        raise


@_serialized
def cancel(db: sqlite3.Connection, job_id: str) -> dict | None:
    job = change(
        db, job_id, allowed={"queued"}, status="cancelled", stage="已取消",
        finished_at=time.time(),
    )
    if not job:
        return None
    if job["status"] == "cancelled":
        return job
    return change(db, job_id, allowed={"running"}, status="cancelling", stage="正在停止辨識…")


def public_job(db: sqlite3.Connection, job: dict) -> dict:
    result = {key: value for key, value in job.items() if key != "suffix"}
    result["queue_position"] = 0
    if job["status"] == "queued":
        result["queue_position"] = db.execute(
            "SELECT COUNT(*) + 1 FROM jobs WHERE status = 'queued' AND created_at < ?",
            (job["created_at"],),
        ).fetchone()[0]
    result["expires_at"] = job["finished_at"] + RETENTION if job["finished_at"] else None
    return result


@_serialized
def heartbeat(db: sqlite3.Connection) -> None:
    db.execute(
        "INSERT INTO runtime(key, value) VALUES ('worker_heartbeat', ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (str(time.time()),),
    )


def worker_alive(db: sqlite3.Connection) -> bool:
    row = db.execute("SELECT value FROM runtime WHERE key = 'worker_heartbeat'").fetchone()
    return bool(row and time.time() - float(row["value"]) < WORKER_STALE_SECONDS)


@_serialized
def recover_interrupted(db: sqlite3.Connection) -> None:
    rows = db.execute(
        "SELECT payload FROM jobs WHERE status IN ('running', 'cancelling')"
    ).fetchall()
    for row in rows:
        job = _load(row)
        change(
            db, job["id"], status="failed", stage="辨識中斷",
            error="辨識服務重新啟動，請重新送出樂譜。", finished_at=time.time(),
        )


@_serialized
def delete_expired(db: sqlite3.Connection) -> list[str]:
    placeholders = ",".join("?" for _ in TERMINAL)
    expired = [row["id"] for row in db.execute(
        f"SELECT id FROM jobs WHERE status IN ({placeholders}) "
        "AND COALESCE(finished_at, created_at) < ?",
        (*TERMINAL, time.time() - RETENTION),
    )]
    if expired:
        db.executemany("DELETE FROM jobs WHERE id = ?", ((job_id,) for job_id in expired))
    return expired
