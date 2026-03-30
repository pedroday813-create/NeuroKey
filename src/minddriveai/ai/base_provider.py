"""
Base Provider - Interface abstrata para provedores de IA.

Todos os provedores devem implementar esta interface para garantir
comportamento consistente em toda a aplicacao.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Generator
from dataclasses import dataclass
from enum import Enum
from typing import Any


@dataclass
class GenerationResult:
    """Resultado de uma geracao de texto."""
    text: str
    token_in: int
    token_out: int
    token_total: int
    model: str
    provider: str


class AIProvider(ABC):
    """
    Interface abstrata para provedores de IA.
    
    Todos os provedores (Gemini, OpenAI, etc) devem implementar
    esta interface para garantir comportamento consistente.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Nome do provedor (ex: 'gemini', 'openai')."""
        ...
    
    @property
    @abstractmethod
    def available_models(self) -> list[str]:
        """Lista de modelos disponiveis para este provedor."""
        ...
    
    @property
    @abstractmethod
    def default_model(self) -> str:
        """Modelo padrao do provedor."""
        ...
    
    @abstractmethod
    def validate_api_key(self) -> tuple[bool, str]:
        """
        Valida se a API key esta configurada corretamente.
        
        Returns:
            Tupla (sucesso, mensagem)
        """
        ...
    
    @abstractmethod
    def count_tokens(self, model: str, contents: list[dict[str, Any]]) -> int:
        """
        Conta tokens de uma lista de conteudos.
        
        Args:
            model: Nome do modelo
            contents: Lista de mensagens/conteudos
            
        Returns:
            Numero de tokens
        """
        ...
    
    @abstractmethod
    def stream_reply(
        self,
        model: str,
        history: list[dict[str, Any]],
        user_text: str,
        temperature: float,
        max_output_tokens: int,
        stop_flag: list[bool],
    ) -> Generator[str, None, GenerationResult]:
        """
        Gera uma resposta em streaming.
        
        Args:
            model: Nome do modelo a usar
            history: Historico de mensagens anteriores
            user_text: Texto do usuario
            temperature: Temperatura de geracao (0.0-1.0)
            max_output_tokens: Maximo de tokens na resposta
            stop_flag: Flag para interromper geracao
            
        Yields:
            Pedacos de texto da resposta
            
        Returns:
            GenerationResult com estatisticas
        """
        ...
    
    @abstractmethod
    def generate_sync(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> GenerationResult:
        """
        Gera uma resposta de forma sincrona (sem streaming).
        
        Args:
            model: Nome do modelo
            prompt: Texto do prompt
            temperature: Temperatura de geracao
            max_output_tokens: Maximo de tokens
            
        Returns:
            GenerationResult com texto e estatisticas
        """
        ...
