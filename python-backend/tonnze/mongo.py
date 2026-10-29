"""Shared MongoDB client configuration for Atlas and hosted runtimes."""
from __future__ import annotations

import certifi
from pymongo import MongoClient

from tonnze.config import MONGO_DATABASE, MONGO_URI


def create_mongo_client(appname: str) -> MongoClient:
    """Create an Atlas client using a bundled, portable CA certificate store."""
    return MongoClient(
        MONGO_URI,
        appname=appname,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where(),
    )


def get_mongo_database(client: MongoClient):
    """Select the same explicit database in the API and worker."""
    if MONGO_DATABASE:
        return client[MONGO_DATABASE]
    # Offline tests may inject a client whose URI already contains a database.
    # Production Mongo mode is validated in config and never uses this branch.
    try:
        return client.get_default_database()
    except Exception as error:
        raise RuntimeError("缺少必要環境變數 MONGO_DATABASE") from error
