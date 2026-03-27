from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AppPaths:
    base_dir: Path
    data_dir: Path
    db_path: Path
    logs_dir: Path
    exports_dir: Path
    secret_path: Path


def detect_base_dir() -> Path:
    env_dir = os.getenv("MINDDRIVEAI_DATA_DIR")
    if env_dir:
        return Path(env_dir).resolve()
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[3]


def build_paths() -> AppPaths:
    base_dir = detect_base_dir()
    data_dir = base_dir / "data"
    logs_dir = data_dir / "logs"
    exports_dir = data_dir / "exports"
    for path in (data_dir, logs_dir, exports_dir):
        path.mkdir(parents=True, exist_ok=True)
    return AppPaths(
        base_dir=base_dir,
        data_dir=data_dir,
        db_path=data_dir / "minddriveai.db",
        logs_dir=logs_dir,
        exports_dir=exports_dir,
        secret_path=data_dir / "secret.json",
    )
