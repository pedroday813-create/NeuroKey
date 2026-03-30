"""
OpenAI Provider - Implementacao do provider para OpenAI/ChatGPT.
"""

from __future__ import annotations

import random
import time
from collections.abc import Generator
from typing import Any

import httpx

from minddriveai.ai.base_provider import AIProvider, GenerationResult
from minddriveai.core.exceptions import (
    AuthenticationError,
    OfflineError,
    RateLimitError,
    SafetyBlockedError,
)


class OpenAIProvider(AIProvider):
    """Provider para OpenAI (ChatGPT)."""
    
    MODELS = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
    ]
    
    BASE_URL = "https://api.openai.com/v1"
    
    def __init__(self, api_key: str) -> None:
        """
        Inicializa o provider OpenAI.
        
        Args:
            api_key: Chave de API da OpenAI
        """
        self._api_key = api_key
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
    
    @property
    def provider_name(self) -> str:
        return "openai"
    
    @property
    def available_models(self) -> list[str]:
        return self.MODELS.copy()
    
    @property
    def default_model(self) -> str:
        return "gpt-4o-mini"
    
    def validate_api_key(self) -> tuple[bool, str]:
        """Valida a API key fazendo uma requisicao de teste."""
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{self.BASE_URL}/models",
                    headers=self._headers,
                )
                
                if response.status_code == 200:
                    return True, "API key da OpenAI validada com sucesso!"
                elif response.status_code == 401:
                    return False, "API key da OpenAI invalida."
                elif response.status_code == 403:
                    return False, "API key sem permissao ou conta suspensa."
                elif response.status_code == 429:
                    # Rate limit mas key valida
                    return True, "API key valida (rate limit atingido temporariamente)."
                else:
                    data = response.json() if response.content else {}
                    error_msg = data.get("error", {}).get("message", "Erro desconhecido")
                    return False, f"Erro ao validar: {error_msg}"
                    
        except httpx.ConnectError:
            return False, "Erro de conexao. Verifique sua internet."
        except httpx.TimeoutException:
            return False, "Timeout na conexao. Tente novamente."
        except Exception as exc:
            return False, f"Erro inesperado: {exc}"
    
    def count_tokens(self, model: str, contents: list[dict[str, Any]]) -> int:
        """Estima contagem de tokens (aproximado)."""
        # OpenAI nao tem endpoint de contagem, fazemos estimativa
        total_chars = sum(
            len(str(c.get("content", ""))) 
            for c in contents
        )
        # Estimativa: ~4 caracteres por token
        return total_chars // 4
    
    def _convert_history_to_openai(
        self, 
        history: list[dict[str, Any]], 
        user_text: str
    ) -> list[dict[str, str]]:
        """Converte historico do formato Gemini para OpenAI."""
        messages: list[dict[str, str]] = []
        
        for item in history:
            role = item.get("role", "")
            parts = item.get("parts", [])
            content = ""
            
            if parts and isinstance(parts, list):
                for part in parts:
                    if isinstance(part, dict) and "text" in part:
                        content += part["text"]
                    elif isinstance(part, str):
                        content += part
            
            if role == "model":
                messages.append({"role": "assistant", "content": content})
            elif role == "user":
                messages.append({"role": "user", "content": content})
        
        # Adiciona mensagem atual do usuario
        messages.append({"role": "user", "content": user_text})
        
        return messages
    
    def stream_reply(
        self,
        model: str,
        history: list[dict[str, Any]],
        user_text: str,
        temperature: float,
        max_output_tokens: int,
        stop_flag: list[bool],
    ) -> Generator[str, None, GenerationResult]:
        """Gera resposta em streaming usando a API da OpenAI."""
        messages = self._convert_history_to_openai(history, user_text)
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_output_tokens,
            "stream": True,
        }
        
        retries = 0
        while True:
            try:
                with httpx.Client(timeout=120.0) as client:
                    text_parts: list[str] = []
                    
                    with client.stream(
                        "POST",
                        f"{self.BASE_URL}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    ) as response:
                        
                        # Verifica erros antes do stream
                        if response.status_code != 200:
                            error_body = ""
                            for chunk in response.iter_bytes():
                                error_body += chunk.decode("utf-8", errors="ignore")
                            self._handle_error(response.status_code, error_body)
                        
                        # Processa stream
                        for line in response.iter_lines():
                            if stop_flag[0]:
                                break
                            
                            if not line or not line.startswith("data: "):
                                continue
                            
                            data_str = line[6:]  # Remove "data: "
                            
                            if data_str == "[DONE]":
                                break
                            
                            try:
                                import json
                                data = json.loads(data_str)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    text_parts.append(content)
                                    yield content
                            except (json.JSONDecodeError, IndexError, KeyError):
                                continue
                    
                    full_text = "".join(text_parts)
                    
                    # OpenAI nao retorna contagem exata no stream, estimamos
                    prompt_tokens = sum(len(m["content"]) // 4 for m in messages)
                    completion_tokens = len(full_text) // 4
                    
                    return GenerationResult(
                        text=full_text,
                        token_in=prompt_tokens,
                        token_out=completion_tokens,
                        token_total=prompt_tokens + completion_tokens,
                        model=model,
                        provider="openai",
                    )
                    
            except (httpx.ConnectError, httpx.TimeoutException) as exc:
                retries += 1
                if retries > 4:
                    raise OfflineError(f"Falha de conexao apos {retries} tentativas: {exc}") from exc
                sleep_s = min(8.0, 0.8 * (2**retries)) + random.uniform(0, 0.4)
                time.sleep(sleep_s)
                continue
            except (AuthenticationError, RateLimitError, SafetyBlockedError, OfflineError):
                raise
            except Exception as exc:
                raise RuntimeError(f"Erro inesperado: {exc}") from exc
    
    def _handle_error(self, status_code: int, body: str) -> None:
        """Trata erros da API OpenAI."""
        try:
            import json
            data = json.loads(body)
            error_msg = data.get("error", {}).get("message", "Erro desconhecido")
            error_type = data.get("error", {}).get("type", "")
        except (json.JSONDecodeError, KeyError):
            error_msg = body or "Erro desconhecido"
            error_type = ""
        
        if status_code == 401:
            raise AuthenticationError(f"API key invalida: {error_msg}")
        elif status_code == 403:
            raise AuthenticationError(f"Sem permissao: {error_msg}")
        elif status_code == 429:
            raise RateLimitError(f"Rate limit excedido: {error_msg}")
        elif status_code == 400 and "content_policy" in error_type.lower():
            raise SafetyBlockedError(f"Conteudo bloqueado: {error_msg}")
        elif status_code >= 500:
            raise OfflineError(f"Erro no servidor OpenAI: {error_msg}")
        else:
            raise RuntimeError(f"Erro HTTP {status_code}: {error_msg}")
    
    def generate_sync(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> GenerationResult:
        """Gera resposta de forma sincrona."""
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_output_tokens,
        }
        
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers=self._headers,
                    json=payload,
                )
                
                if response.status_code != 200:
                    self._handle_error(response.status_code, response.text)
                
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                
                return GenerationResult(
                    text=text,
                    token_in=usage.get("prompt_tokens", 0),
                    token_out=usage.get("completion_tokens", 0),
                    token_total=usage.get("total_tokens", 0),
                    model=model,
                    provider="openai",
                )
                
        except (AuthenticationError, RateLimitError, SafetyBlockedError, OfflineError):
            raise
        except httpx.ConnectError as exc:
            raise OfflineError(f"Erro de conexao: {exc}") from exc
        except httpx.TimeoutException as exc:
            raise OfflineError(f"Timeout: {exc}") from exc
        except Exception as exc:
            raise RuntimeError(f"Erro inesperado: {exc}") from exc
