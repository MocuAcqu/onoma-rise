"""Mongo queue and GridFS tests that never contact the configured Atlas cluster."""
from __future__ import annotations

import time
from pathlib import Path

import mongomock
import pytest
from mongomock.gridfs import enable_gridfs_integration

from tonnze.recognition.storage import MongoScoreStorage
from tonnze.repositories.mongo_jobs import MongoJobRepository


enable_gridfs_integration()


def mongo_client():
    return mongomock.MongoClient("mongodb://localhost/onoma_test")


def test_mongo_queue_claims_oldest_job_and_tracks_worker():
    repository = MongoJobRepository(client=mongo_client())
    first = repository.create_job("first", "first.png", ".png")
    second = repository.create_job("second", "second.png", ".png")

    claimed = repository.claim_next()

    assert claimed["id"] == first["id"]
    assert claimed["status"] == "running"
    assert repository.public_job(second)["queue_position"] == 1
    assert not repository.worker_alive()
    repository.heartbeat()
    assert repository.worker_alive()


def test_mongo_queue_updates_and_expires_terminal_job():
    repository = MongoJobRepository(client=mongo_client())
    repository.create_job("job", "score.pdf", ".pdf")
    repository.claim_next()

    completed = repository.change(
        "job",
        allowed={"running"},
        status="complete",
        percent=100,
        finished_at=time.time() - 100_000,
    )

    assert completed["status"] == "complete"
    assert completed["percent"] == 100
    assert repository.delete_expired() == ["job"]
    assert repository.get_job("job") is None


def test_gridfs_materializes_source_and_publishes_results(tmp_path: Path):
    storage = MongoScoreStorage(client=mongo_client())
    source = tmp_path / "source.png"
    source.write_bytes(b"score-source")
    storage.save_source("job", ".png", source)
    job = {"id": "job", "suffix": ".png"}

    with storage.work_directory(job) as work:
        assert (work / "source.png").read_bytes() == b"score-source"
        (work / "result.musicxml").write_bytes(b"<score-partwise/>")
        (work / "result.mid").write_bytes(b"MThd")
        (work / "result.json").write_text('{"note_count":1}', encoding="utf-8")
        (work / "diagnostics.json").write_text("{}", encoding="utf-8")
        storage.publish_results("job", work)

    with storage.open_file(job, "musicxml") as stream:
        assert stream.read() == b"<score-partwise/>"
    with storage.local_file(job, "metadata") as metadata:
        assert metadata.read_text(encoding="utf-8") == '{"note_count":1}'

    storage.delete_job("job")
    with pytest.raises(FileNotFoundError):
        storage.open_file(job, "source")
