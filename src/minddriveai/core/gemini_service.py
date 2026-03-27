from __future__ import annotations

import random
import time
from collections.abc import Generator
from dataclasses import dataclass
from typing import Any

from google import genai

from minddriveai.core.exceptions import (
    AuthenticationError,
    OfflineError,
    RateLimitError,
    SafetyBlockedError,
)
from minddriveai.core.safety import default_safety_settings


@dataclass
class GenerationResult:
    text: str
    token_in: int
    token_out: int
    token_total: int


class GeminiService:
    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)

    def count_tokens(self, model: str, contents: list[dict[str, Any]]) -> int:
        resp = self.client.models.count_tokens(model=model, contents=contents)
        total = getattr(resp, "total_tokens", None)
        return int(total or 0)

    def stream_reply(
        self,
        model: str,
        history: list[dict[str, Any]],
        user_text: str,
        temperature: float,
        max_output_tokens: int,
        stop_flag: list[bool],
    ) -> Generator[str, None, GenerationResult]:
        retries = 0
        while True:
            try:
                chat = self.client.chats.create(model=model, history=history)
                stream = chat.send_message_stream(
                    message=user_text,
                    config={
                        "temperature": temperature,
                        "max_output_tokens": max_output_tokens,
                        "safety_settings": default_safety_settings(),
                    },
                )
                text_parts: list[str] = []
                last_chunk: Any = None
                for chunk in stream:
                    if stop_flag[0]:
                        break
                    piece = getattr(chunk, "text", "") or ""
                    if piece:
                        text_parts.append(piece)
                        yield piece
                    last_chunk = chunk

                usage = getattr(last_chunk, "usage_metadata", None) if last_chunk else None
                token_in = int(getattr(usage, "prompt_token_count", 0) or 0)
                token_out = int(getattr(usage, "candidates_token_count", 0) or 0)
                token_total = int(getattr(usage, "total_token_count", token_in + token_out) or 0)
                full_text = "".join(text_parts)
                if not full_text.strip() and not stop_flag[0]:
                    raise SafetyBlockedError("Resposta bloqueada por safety settings ou vazia.")
                return GenerationResult(full_text, token_in, token_out, token_total)
            except Exception as exc:
                msg = str(exc).lower()
                status_429 = "429" in msg or ("rate" in msg and "limit" in msg)
                status_408 = "408" in msg or "timeout" in msg
                auth = "401" in msg or "403" in msg or "api key" in msg
                offline = "name resolution" in msg or "connection" in msg or "network" in msg
                blocked = "safety" in msg or "blocked" in msg

                if blocked:
                    raise SafetyBlockedError(str(exc)) from exc
                if auth:
                    raise AuthenticationError(str(exc)) from exc
                if offline:
                    raise OfflineError(str(exc)) from exc
                if status_429 or status_408:
                    retries += 1
                    if retries > 4:
                        raise RateLimitError(str(exc)) from exc
                    sleep_s = min(8.0, 0.8 * (2**retries)) + random.uniform(0, 0.4)
                    time.sleep(sleep_s)
                    continue
                raise
