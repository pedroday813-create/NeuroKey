"""
Provider Validator - Validacao de API keys e configuracoes.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from minddriveai.ai.provider_factory import ProviderType


@dataclass
class ValidationResult:
    """Resultado de uma validacao."""
    is_valid: bool
    message: str
    details: str = ""


class ProviderValidator:
    """Validador de API keys e configuracoes de providers."""
    
    # Padroes de API keys conhecidos
    PATTERNS = {
        "gemini": r"^AIza[a-zA-Z0-9_-]{35}$",
        "openai": r"^sk-[a-zA-Z0-9]{20,}$",
    }
    
    @classmethod
    def validate_key_format(
        cls, 
        provider_type: "ProviderType", 
        api_key: str
    ) -> ValidationResult:
        """
        Valida o formato da API key (validacao local, sem requisicao).
        
        Args:
            provider_type: Tipo do provider
            api_key: Chave de API
            
        Returns:
            ValidationResult com resultado
        """
        if not api_key:
            return ValidationResult(
                is_valid=False,
                message="API key nao fornecida.",
                details="Por favor, insira uma API key valida."
            )
        
        api_key = api_key.strip()
        
        if len(api_key) < 10:
            return ValidationResult(
                is_valid=False,
                message="API key muito curta.",
                details="A key parece incompleta. Verifique se copiou corretamente."
            )
        
        pattern = cls.PATTERNS.get(provider_type.value)
        if pattern and not re.match(pattern, api_key):
            hints = {
                "gemini": "Keys do Gemini comecam com 'AIza' e tem 39 caracteres.",
                "openai": "Keys da OpenAI comecam com 'sk-'.",
            }
            hint = hints.get(provider_type.value, "")
            return ValidationResult(
                is_valid=False,
                message=f"Formato da API key parece invalido para {provider_type.value}.",
                details=hint
            )
        
        return ValidationResult(
            is_valid=True,
            message="Formato da API key parece valido.",
            details="Formato verificado, mas ainda precisa ser validado online."
        )
    
    @classmethod
    def validate_key_online(
        cls, 
        provider_type: "ProviderType", 
        api_key: str
    ) -> ValidationResult:
        """
        Valida a API key fazendo uma requisicao real.
        
        Args:
            provider_type: Tipo do provider
            api_key: Chave de API
            
        Returns:
            ValidationResult com resultado
        """
        # Primeiro valida formato
        format_result = cls.validate_key_format(provider_type, api_key)
        if not format_result.is_valid:
            return format_result
        
        # Depois valida online
        try:
            from minddriveai.ai.provider_factory import ProviderFactory
            
            provider = ProviderFactory.create(provider_type, api_key)
            is_valid, message = provider.validate_api_key()
            
            return ValidationResult(
                is_valid=is_valid,
                message=message,
                details="Validacao completa realizada."
            )
        except Exception as exc:
            return ValidationResult(
                is_valid=False,
                message=f"Erro ao validar: {exc}",
                details="Verifique sua conexao e tente novamente."
            )
    
    @classmethod
    def diagnose_error(cls, error_message: str) -> str:
        """
        Diagnostica mensagem de erro e retorna sugestao.
        
        Args:
            error_message: Mensagem de erro
            
        Returns:
            Sugestao de correcao
        """
        msg = error_message.lower()
        
        if "401" in msg or "invalid" in msg or "api key" in msg:
            return (
                "A API key parece invalida. Possiveis causas:\n"
                "- Key expirada ou revogada\n"
                "- Key copiada incorretamente\n"
                "- Key de projeto diferente\n\n"
                "Solucao: Gere uma nova API key no site do provider."
            )
        
        if "403" in msg or "permission" in msg or "forbidden" in msg:
            return (
                "Sem permissao para acessar a API. Possiveis causas:\n"
                "- Conta suspensa\n"
                "- Restricao geografica\n"
                "- API nao habilitada no projeto\n\n"
                "Solucao: Verifique sua conta no site do provider."
            )
        
        if "429" in msg or "rate limit" in msg or "quota" in msg:
            return (
                "Limite de uso excedido. Possiveis causas:\n"
                "- Muitas requisicoes em pouco tempo\n"
                "- Cota mensal esgotada\n"
                "- Limite de tokens atingido\n\n"
                "Solucao: Aguarde alguns minutos ou verifique sua cota."
            )
        
        if "402" in msg or "billing" in msg or "payment" in msg or "insufficient" in msg:
            return (
                "Problema de cobranca. Possiveis causas:\n"
                "- Saldo insuficiente na conta\n"
                "- Cartao de credito invalido\n"
                "- Conta gratuita sem creditos\n\n"
                "Solucao: Adicione creditos ou verifique seu metodo de pagamento."
            )
        
        if "connection" in msg or "network" in msg or "offline" in msg:
            return (
                "Erro de conexao. Possiveis causas:\n"
                "- Sem conexao com a internet\n"
                "- Firewall bloqueando requisicao\n"
                "- Proxy mal configurado\n\n"
                "Solucao: Verifique sua conexao com a internet."
            )
        
        if "timeout" in msg:
            return (
                "Tempo de espera esgotado. Possiveis causas:\n"
                "- Conexao lenta\n"
                "- Servidor sobrecarregado\n"
                "- Requisicao muito grande\n\n"
                "Solucao: Tente novamente em alguns minutos."
            )
        
        if "safety" in msg or "blocked" in msg or "content_policy" in msg:
            return (
                "Conteudo bloqueado por politica de seguranca.\n"
                "O provider detectou conteudo que viola suas diretrizes.\n\n"
                "Solucao: Reformule sua mensagem."
            )
        
        return (
            "Erro desconhecido. Possiveis acoes:\n"
            "- Verifique sua API key\n"
            "- Verifique sua conexao\n"
            "- Tente novamente em alguns minutos\n"
            "- Consulte a documentacao do provider"
        )
