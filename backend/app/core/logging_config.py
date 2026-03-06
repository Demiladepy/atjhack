"""Structured logging configuration."""

import logging
import sys
from typing import Any

from app.core.config import settings


def configure_logging() -> None:
    """Configure root logger and app logger with consistent format."""
    level = logging.DEBUG if settings.app_env == "development" else logging.INFO
    fmt = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=level,
        format=fmt,
        datefmt=date_fmt,
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    # Reduce noise from third-party libs
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a logger for the given module name (e.g. __name__)."""
    return logging.getLogger(name)


def log_exception(log: logging.Logger, message: str, exc: BaseException, **extra: Any) -> None:
    """Log an exception with optional extra context (e.g. merchant_id, message_id)."""
    log.exception("%s: %s", message, exc, extra=extra or None)
