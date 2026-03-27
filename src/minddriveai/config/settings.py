from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class AppSettings:
    model: str = "gemini-2.5-flash"
    temperature: float = 0.4
    max_output_tokens: int = 1024
    context_window_messages: int = 10
    telemetry_opt_in: bool = False


def settings_to_dict(settings: AppSettings) -> dict[str, Any]:
    return asdict(settings)
