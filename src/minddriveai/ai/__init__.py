"""
MindDriveAI - AI Providers Module

Este modulo contem a arquitetura de providers para suportar
multiplos provedores de IA (Gemini, OpenAI, etc).
"""

from minddriveai.ai.base_provider import AIProvider, GenerationResult
from minddriveai.ai.provider_factory import ProviderFactory, ProviderType
from minddriveai.ai.gemini_provider import GeminiProvider
from minddriveai.ai.openai_provider import OpenAIProvider
from minddriveai.ai.provider_validator import ProviderValidator

__all__ = [
    "AIProvider",
    "GenerationResult",
    "ProviderFactory",
    "ProviderType",
    "GeminiProvider",
    "OpenAIProvider",
    "ProviderValidator",
]
