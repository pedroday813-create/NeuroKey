"""
Gemini Provider - Implementacao do provider para Google Gemini AI.
"""

from __future__ import annotations

import random
import time
from collections.abc import Generator
from typing import Any

from google import genai

from minddriveai.ai.base_provider import AIProvider, GenerationResult
from minddriveai.core.exceptions import (
    AuthenticationError,
    OfflineError,
    RateLimitError,
    SafetyBlockedError,
)
from minddriveai.core.safety import default_safety_settings


class GeminiProvider(AIProvider):
    """Provider para Google Gemini AI."""
    
    MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]
    
    def __init__(self, api_key: str) -> None:
        """
        Inicializa o provider Gemini.
        
        Args:
            api_key: Chave de API do Google AI Studio
        """
        self._api_key = api_key
        self._client = genai.Client(api_key=api_key)
    
    @property
    def provider_name(self) -> str:
        return "gemini"
    
    @property
    def available_models(self) -> list[str]:
        return self.MODELS.copy()
    
    @property
    def default_model(self) -> str:
        return "gemini-2.5-flash"
    
    def validate_api_key(self) -> tuple[bool, str]:
        """Valida a API key fazendo uma requisicao de teste."""
        try:
            # Tenta listar modelos para validar a key
            models = self._client.models.list()
            if models:
                return True, "API key do Gemini validada com sucesso!"
            return True, "API key do Gemini parece valida."
        except Exception as exc:
            msg = str(exc).lower()
            if "401" in msg or "403" in msg or "api key" in msg or "invalid" in msg:
                return False, "API key do Gemini invalida ou sem permissao."
            if "connection" in msg or "network" in msg:
                return False, "Erro de conexao. Verifique sua internet."
            return False, f"Erro ao validar API key: {exc}"
    
    def count_tokens(self, model: str, contents: list[dict[str, Any]]) -> int:
        """Conta tokens usando a API do Gemini."""
        try:
            resp = self._client.models.count_tokens(model=model, contents=contents)
            total = getattr(resp, "total_tokens", None)
            return int(total or 0)
        except Exception:
            return 0
    
    def stream_reply(
        self,
        model: str,
        history: list[dict[str, Any]],
        user_text: str,
        temperature: float,
        max_output_tokens: int,
        stop_flag: list[bool],
    ) -> Generator[str, None, GenerationResult]:
        """Gera resposta em streaming usando o Gemini."""
        retries = 0
        while True:
            try:
                chat = self._client.chats.create(model=model, history=history)
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
                
                return GenerationResult(
                    text=full_text,
                    token_in=token_in,
                    token_out=token_out,
                    token_total=token_total,
                    model=model,
                    provider="gemini",
                )
                
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
    
    def generate_sync(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> GenerationResult:
        """Gera resposta de forma sincrona."""
        try:
            response = self._client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "temperature": temperature,
                    "max_output_tokens": max_output_tokens,
                    "safety_settings": default_safety_settings(),
                },
            )
            
            text = getattr(response, "text", "") or ""
            usage = getattr(response, "usage_metadata", None)
            token_in = int(getattr(usage, "prompt_token_count", 0) or 0)
            token_out = int(getattr(usage, "candidates_token_count", 0) or 0)
            
            return GenerationResult(
                text=text,
                token_in=token_in,
                token_out=token_out,
                token_total=token_in + token_out,
                model=model,
                provider="gemini",
            )
        except Exception as exc:
            msg = str(exc).lower()
            if "401" in msg or "403" in msg or "api key" in msg:
                raise AuthenticationError(str(exc)) from exc
            if "connection" in msg or "network" in msg:
                raise OfflineError(str(exc)) from exc
            if "safety" in msg or "blocked" in msg:
                raise SafetyBlockedError(str(exc)) from exc
            raise
