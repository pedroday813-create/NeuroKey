"""
Provider Factory - Fabrica para criar instancias de providers de IA.
"""

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from minddriveai.ai.base_provider import AIProvider


class ProviderType(str, Enum):
    """Tipos de providers suportados."""
    GEMINI = "gemini"
    OPENAI = "openai"
    
    @classmethod
    def from_string(cls, value: str) -> "ProviderType":
        """Converte string para ProviderType."""
        value_lower = value.lower().strip()
        if value_lower in ("gemini", "google"):
            return cls.GEMINI
        elif value_lower in ("openai", "chatgpt", "gpt"):
            return cls.OPENAI
        else:
            raise ValueError(f"Provider desconhecido: {value}")
    
    @property
    def display_name(self) -> str:
        """Nome para exibicao na UI."""
        names = {
            ProviderType.GEMINI: "Google Gemini",
            ProviderType.OPENAI: "OpenAI (ChatGPT)",
        }
        return names.get(self, self.value)
    
    @property
    def api_key_hint(self) -> str:
        """Dica de onde obter a API key."""
        hints = {
            ProviderType.GEMINI: "Obtenha em: https://makersuite.google.com/app/apikey",
            ProviderType.OPENAI: "Obtenha em: https://platform.openai.com/api-keys",
        }
        return hints.get(self, "")
    
    @property
    def env_var_name(self) -> str:
        """Nome da variavel de ambiente para a API key."""
        names = {
            ProviderType.GEMINI: "GEMINI_API_KEY",
            ProviderType.OPENAI: "OPENAI_API_KEY",
        }
        return names.get(self, "")


class ProviderFactory:
    """Fabrica para criar providers de IA."""
    
    @staticmethod
    def create(provider_type: ProviderType, api_key: str) -> "AIProvider":
        """
        Cria uma instancia do provider especificado.
        
        Args:
            provider_type: Tipo do provider
            api_key: Chave de API
            
        Returns:
            Instancia do provider
            
        Raises:
            ValueError: Se o provider nao for suportado
        """
        from minddriveai.ai.gemini_provider import GeminiProvider
        from minddriveai.ai.openai_provider import OpenAIProvider
        
        if provider_type == ProviderType.GEMINI:
            return GeminiProvider(api_key)
        elif provider_type == ProviderType.OPENAI:
            return OpenAIProvider(api_key)
        else:
            raise ValueError(f"Provider nao suportado: {provider_type}")
    
    @staticmethod
    def get_available_providers() -> list[ProviderType]:
        """Retorna lista de providers disponiveis."""
        return list(ProviderType)
    
    @staticmethod
    def get_models_for_provider(provider_type: ProviderType) -> list[str]:
        """
        Retorna lista de modelos para um provider.
        
        Args:
            provider_type: Tipo do provider
            
        Returns:
            Lista de nomes de modelos
        """
        from minddriveai.ai.gemini_provider import GeminiProvider
        from minddriveai.ai.openai_provider import OpenAIProvider
        
        if provider_type == ProviderType.GEMINI:
            return GeminiProvider.MODELS
        elif provider_type == ProviderType.OPENAI:
            return OpenAIProvider.MODELS
        else:
            return []
    
    @staticmethod
    def get_default_model(provider_type: ProviderType) -> str:
        """
        Retorna modelo padrao para um provider.
        
        Args:
            provider_type: Tipo do provider
            
        Returns:
            Nome do modelo padrao
        """
        defaults = {
            ProviderType.GEMINI: "gemini-2.5-flash",
            ProviderType.OPENAI: "gpt-4o-mini",
        }
        return defaults.get(provider_type, "")
