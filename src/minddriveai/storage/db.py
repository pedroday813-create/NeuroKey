from __future__ import annotations

import sqlite3
from pathlib import Path

from minddriveai.storage.migrations import run_migrations


class Database:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys=ON;")
        run_migrations(self.conn)

    def close(self) -> None:
        self.conn.close()
