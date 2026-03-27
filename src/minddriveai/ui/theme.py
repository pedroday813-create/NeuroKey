from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Theme:
    bg_app: str = "#0b1020"
    bg_sidebar: str = "#11182b"
    bg_panel: str = "#141d33"
    bg_card: str = "#1a2642"
    bg_input: str = "#0f172a"

    text_primary: str = "#e2e8f0"
    text_secondary: str = "#94a3b8"
    text_muted: str = "#64748b"

    border: str = "#22304f"
    accent: str = "#4f46e5"
    accent_hover: str = "#6366f1"
    cyan: str = "#06b6d4"

    success: str = "#10b981"
    warning: str = "#f59e0b"
    error: str = "#ef4444"

    radius: int = 14
    spacing_xs: int = 6
    spacing_sm: int = 10
    spacing_md: int = 14
    spacing_lg: int = 20

    font_main: tuple[str, int] = ("Segoe UI", 10)
    font_title: tuple[str, int, str] = ("Segoe UI Semibold", 12, "bold")
    font_logo: tuple[str, int, str] = ("Segoe UI Semibold", 15, "bold")
    font_chat: tuple[str, int] = ("Segoe UI", 11)


def get_theme() -> Theme:
    return Theme()
