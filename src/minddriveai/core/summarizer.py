from __future__ import annotations

from minddriveai.storage.models import Message


def build_summary_prompt(messages: list[Message]) -> str:
    lines = [f"{m.role}: {m.content}" for m in messages]
    return "Resuma de forma objetiva os pontos principais desta conversa:\n\n" + "\n".join(lines)
