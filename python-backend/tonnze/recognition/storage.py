"""Pluggable score artifacts: local filesystem or MongoDB GridFS."""
from __future__ import annotations

import shutil
import tempfile
from contextlib import contextmanager
from functools import lru_cache
from pathlib import Path
from typing import BinaryIO, Iterator

from tonnze.config import DATA, MONGO_GRIDFS_BUCKET, SCORE_STORAGE_BACKEND
from tonnze.mongo import create_mongo_client, get_mongo_database


ARTIFACTS = {
    "musicxml": "result.musicxml",
    "midi": "result.mid",
    "metadata": "result.json",
    "diagnostics": "diagnostics.json",
    "log": "worker.log",
}


class FilesystemScoreStorage:
    """Existing durable-directory behavior used by local and Oracle installs."""

    def save_source(self, job_id: str, suffix: str, source: Path) -> None:
        work = DATA / job_id
        work.mkdir(parents=True, exist_ok=False)
        shutil.copyfile(source, work / f"source{suffix}")

    @contextmanager
    def work_directory(self, job: dict) -> Iterator[Path]:
        yield DATA / job["id"]

    def publish_results(self, _job_id: str, _work: Path) -> None:
        # Results are already written into the durable work directory.
        return

    @contextmanager
    def local_file(self, job: dict, kind: str) -> Iterator[Path]:
        filename = f"source{job['suffix']}" if kind == "source" else ARTIFACTS[kind]
        path = DATA / job["id"] / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        yield path

    def open_file(self, job: dict, kind: str) -> BinaryIO:
        filename = f"source{job['suffix']}" if kind == "source" else ARTIFACTS[kind]
        path = DATA / job["id"] / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        return path.open("rb")

    def delete_job(self, job_id: str) -> None:
        shutil.rmtree(DATA / job_id, ignore_errors=True)


class MongoScoreStorage:
    """Stream score inputs and results through GridFS without persistent disk."""

    def __init__(self, client=None) -> None:
        from gridfs import GridFS

        self.client = client or create_mongo_client(
            "onoma-rise-recognition-files"
        )
        self.database = get_mongo_database(self.client)
        if client is None:
            self.client.admin.command("ping")
        self.bucket = GridFS(self.database, collection=MONGO_GRIDFS_BUCKET)
        self.files = self.database[f"{MONGO_GRIDFS_BUCKET}.files"]
        self.files.create_index(
            [("metadata.job_id", 1), ("metadata.kind", 1), ("uploadDate", -1)],
            name="recognition_artifact_lookup",
        )

    def _file_document(self, job_id: str, kind: str) -> dict | None:
        return self.files.find_one(
            {"metadata.job_id": job_id, "metadata.kind": kind},
            sort=[("uploadDate", -1)],
        )

    def _delete_kind(self, job_id: str, kind: str) -> None:
        identifiers = self.files.find(
            {"metadata.job_id": job_id, "metadata.kind": kind}, {"_id": 1}
        )
        for document in identifiers:
            self.bucket.delete(document["_id"])

    def _upload(self, job_id: str, kind: str, source: Path) -> None:
        self._delete_kind(job_id, kind)
        with source.open("rb") as stream:
            self.bucket.put(
                stream,
                filename=f"{job_id}/{source.name}",
                metadata={"job_id": job_id, "kind": kind},
            )

    def _download(self, job_id: str, kind: str, target: Path) -> None:
        document = self._file_document(job_id, kind)
        if not document:
            raise FileNotFoundError(f"GridFS artifact missing: {job_id}/{kind}")
        source = self.bucket.get(document["_id"])
        try:
            with target.open("wb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
        finally:
            source.close()

    def save_source(self, job_id: str, suffix: str, source: Path) -> None:
        del suffix  # The suffix is retained in the job document.
        self._upload(job_id, "source", source)

    @contextmanager
    def work_directory(self, job: dict) -> Iterator[Path]:
        # HOMR/music21 require ordinary filesystem paths. Only one job's files
        # are materialized, and TemporaryDirectory removes them after publish.
        with tempfile.TemporaryDirectory(prefix=f"onoma-score-{job['id'][:8]}-") as directory:
            work = Path(directory)
            self._download(job["id"], "source", work / f"source{job['suffix']}")
            yield work

    def publish_results(self, job_id: str, work: Path) -> None:
        for kind, filename in ARTIFACTS.items():
            path = work / filename
            if path.is_file():
                self._upload(job_id, kind, path)

    @contextmanager
    def local_file(self, job: dict, kind: str) -> Iterator[Path]:
        suffix = job["suffix"] if kind == "source" else Path(ARTIFACTS[kind]).suffix
        with tempfile.TemporaryDirectory(prefix="onoma-download-") as directory:
            path = Path(directory) / f"{kind}{suffix}"
            self._download(job["id"], kind, path)
            yield path

    def open_file(self, job: dict, kind: str) -> BinaryIO:
        document = self._file_document(job["id"], kind)
        if not document:
            raise FileNotFoundError(f"GridFS artifact missing: {job['id']}/{kind}")
        return self.bucket.get(document["_id"])

    def delete_job(self, job_id: str) -> None:
        identifiers = list(
            self.files.find({"metadata.job_id": job_id}, {"_id": 1})
        )
        for document in identifiers:
            self.bucket.delete(document["_id"])


@lru_cache(maxsize=1)
def get_score_storage():
    if SCORE_STORAGE_BACKEND == "mongodb":
        return MongoScoreStorage()
    return FilesystemScoreStorage()


def iter_file(source: BinaryIO, chunk_size: int = 1024 * 1024):
    """Yield and close a local/GridFS stream after a response completes."""
    try:
        while chunk := source.read(chunk_size):
            yield chunk
    finally:
        source.close()
