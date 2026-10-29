"""MongoDB-backed recognition queue with the same contract as SQLite jobs."""
from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from pymongo import ASCENDING, ReturnDocument

from tonnze.config import (
    MAX_QUEUE,
    MONGO_JOBS_COLLECTION,
    MONGO_RUNTIME_COLLECTION,
    RETENTION,
    TERMINAL,
    WORKER_STALE_SECONDS,
)
from tonnze.mongo import create_mongo_client, get_mongo_database


def _public_document(document: dict[str, Any] | None) -> dict | None:
    if document is None:
        return None
    result = dict(document)
    result.pop("_id", None)
    result.pop("expire_at", None)
    return result


class MongoJobRepository:
    """Small atomic queue stored beside the existing membership database."""

    def __init__(self, client=None) -> None:
        # An injected client keeps tests offline; production uses Atlas with a
        # bundled CA store so macOS and minimal Linux images verify TLS equally.
        self.client = client or create_mongo_client("onoma-rise-recognition")
        self.database = get_mongo_database(self.client)
        self.jobs = self.database[MONGO_JOBS_COLLECTION]
        self.runtime = self.database[MONGO_RUNTIME_COLLECTION]
        if client is None:
            self.client.admin.command("ping")
        self.jobs.create_index(
            [("status", ASCENDING), ("created_at", ASCENDING)],
            name="recognition_status_created",
        )
        self.jobs.create_index(
            [("status", ASCENDING), ("finished_at", ASCENDING)],
            name="recognition_expiry",
        )

    def get_job(self, job_id: str) -> dict | None:
        return _public_document(self.jobs.find_one({"_id": job_id}))

    def create_job(self, job_id: str, filename: str, suffix: str) -> dict:
        if self.jobs.count_documents({"status": "queued"}, limit=MAX_QUEUE) >= MAX_QUEUE:
            raise ValueError("目前排隊人數較多，請稍後再試。")
        job = {
            "_id": job_id,
            "id": job_id,
            "filename": filename,
            "suffix": suffix,
            "status": "queued",
            "percent": 0,
            "stage": "等待辨識",
            "created_at": time.time(),
            "started_at": None,
            "finished_at": None,
            "error": None,
            "note_count": None,
            "duration": None,
            "bpm": None,
            "engines": None,
            "terms": None,
            "warnings": [],
        }
        self.jobs.insert_one(job)
        return _public_document(job)

    def change(
        self,
        job_id: str,
        allowed: set[str] | None = None,
        **fields: Any,
    ) -> dict | None:
        query: dict[str, Any] = {"_id": job_id}
        if allowed is not None:
            query["status"] = {"$in": list(allowed)}
        update: dict[str, Any] = {}
        percent = fields.pop("percent", None)
        if fields:
            update["$set"] = fields
        if percent is not None:
            update["$max"] = {"percent": percent}
        if fields.get("status") in TERMINAL and fields.get("finished_at"):
            update.setdefault("$set", {})["expire_at"] = datetime.fromtimestamp(
                fields["finished_at"] + RETENTION,
                tz=timezone.utc,
            )
        if not update:
            return self.get_job(job_id)
        document = self.jobs.find_one_and_update(
            query,
            update,
            return_document=ReturnDocument.AFTER,
        )
        # Match SQLite semantics: an allowed-state miss still returns the job,
        # which lets cancellation callers distinguish missing from already done.
        return _public_document(document) or self.get_job(job_id)

    def claim_next(self) -> dict | None:
        document = self.jobs.find_one_and_update(
            {"status": "queued"},
            {
                "$set": {
                    "status": "running",
                    "percent": 1,
                    "stage": "準備辨識",
                    "started_at": time.time(),
                }
            },
            sort=[("created_at", ASCENDING)],
            return_document=ReturnDocument.AFTER,
        )
        return _public_document(document)

    def cancel(self, job_id: str) -> dict | None:
        document = self.jobs.find_one_and_update(
            {"_id": job_id, "status": "queued"},
            {
                "$set": {
                    "status": "cancelled",
                    "stage": "已取消",
                    "finished_at": time.time(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        if document:
            return _public_document(document)
        document = self.jobs.find_one_and_update(
            {"_id": job_id, "status": "running"},
            {"$set": {"status": "cancelling", "stage": "正在停止辨識…"}},
            return_document=ReturnDocument.AFTER,
        )
        return _public_document(document) or self.get_job(job_id)

    def public_job(self, job: dict) -> dict:
        result = {key: value for key, value in job.items() if key != "suffix"}
        result["queue_position"] = 0
        if job["status"] == "queued":
            result["queue_position"] = self.jobs.count_documents(
                {"status": "queued", "created_at": {"$lt": job["created_at"]}}
            ) + 1
        result["expires_at"] = (
            job["finished_at"] + RETENTION if job.get("finished_at") else None
        )
        return result

    def heartbeat(self) -> None:
        self.runtime.update_one(
            {"_id": "worker_heartbeat"},
            {"$set": {"value": time.time()}},
            upsert=True,
        )

    def worker_alive(self) -> bool:
        document = self.runtime.find_one({"_id": "worker_heartbeat"})
        return bool(
            document
            and time.time() - float(document["value"]) < WORKER_STALE_SECONDS
        )

    def recover_interrupted(self) -> None:
        for document in self.jobs.find(
            {"status": {"$in": ["running", "cancelling"]}}, {"_id": 1}
        ):
            self.change(
                str(document["_id"]),
                status="failed",
                stage="辨識中斷",
                error="辨識服務重新啟動，請重新送出樂譜。",
                finished_at=time.time(),
            )

    def delete_expired(self) -> list[str]:
        query = {
            "status": {"$in": list(TERMINAL)},
            "$or": [
                {"finished_at": {"$lt": time.time() - RETENTION}},
                {
                    "finished_at": None,
                    "created_at": {"$lt": time.time() - RETENTION},
                },
            ],
        }
        identifiers = [str(row["_id"]) for row in self.jobs.find(query, {"_id": 1})]
        if identifiers:
            self.jobs.delete_many({"_id": {"$in": identifiers}})
        return identifiers
