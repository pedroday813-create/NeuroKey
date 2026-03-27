from pathlib import Path

from minddriveai.storage.db import Database


def test_db_bootstrap(tmp_path: Path) -> None:
    db = Database(tmp_path / "minddriveai.db")
    row = db.conn.execute("PRAGMA user_version;").fetchone()
    assert int(row[0]) == 1
    db.close()
