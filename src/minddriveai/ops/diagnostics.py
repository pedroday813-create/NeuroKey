from __future__ import annotations

import platform
import sys
from dataclasses import dataclass


@dataclass
class DiagnosticInfo:
    python: str
    platform: str
    frozen: bool


def collect_diagnostics() -> DiagnosticInfo:
    return DiagnosticInfo(
        python=sys.version.split()[0],
        platform=f"{platform.system()} {platform.release()}",
        frozen=bool(getattr(sys, "frozen", False)),
    )
