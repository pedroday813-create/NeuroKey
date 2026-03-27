from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


class ApiKeyFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        text = record.getMessage()
        forbidden = ["AIza", "GEMINI_API_KEY", "GOOGLE_API_KEY"]
        return not any(token in text for token in forbidden)


def configure_logging(log_path: Path) -> logging.Logger:
    logger = logging.getLogger("minddriveai")
    logger.setLevel(logging.DEBUG if os.getenv("MINDDRIVEAI_DEV_MODE") == "1" else logging.INFO)
    logger.handlers.clear()

    handler = RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=3, encoding="utf-8")
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    handler.setFormatter(formatter)
    handler.addFilter(ApiKeyFilter())

    logger.addHandler(handler)
    logger.propagate = False
    return logger
