from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Theme:
    """
    Sistema de tema centralizado para o MindDriveAI.
    Cores inspiradas em apps modernos: Linear, Notion, Arc, ChatGPT.
    Dark mode elegante e profissional.
    """

    # Backgrounds - hierarquia de profundidade
    bg_app: str = "#0a0e17"           # Fundo mais profundo
    bg_sidebar: str = "#0f1420"       # Sidebar levemente mais clara
    bg_panel: str = "#111827"         # Painel principal
    bg_card: str = "#1a2235"          # Cards e containers
    bg_input: str = "#0d1321"         # Campo de input
    bg_hover: str = "#1f2d45"         # Hover states
    bg_active: str = "#243654"        # Item ativo/selecionado
    bg_message_user: str = "#1e3a5f"  # Bolha do usuario
    bg_message_ai: str = "#1a2235"    # Bolha da IA

    # Texto - hierarquia de importancia
    text_primary: str = "#f1f5f9"     # Texto principal (alto contraste)
    text_secondary: str = "#94a3b8"   # Texto secundario
    text_muted: str = "#64748b"       # Texto sutil
    text_placeholder: str = "#4b5563" # Placeholder

    # Bordas e separadores
    border: str = "#1e293b"           # Bordas sutis
    border_focus: str = "#3b82f6"     # Borda em foco
    border_subtle: str = "#1a2332"    # Borda muito sutil

    # Cores de destaque
    accent: str = "#3b82f6"           # Azul primario
    accent_hover: str = "#2563eb"     # Azul hover
    accent_light: str = "#60a5fa"     # Azul claro para texto
    cyan: str = "#22d3ee"             # Cyan para destaques
    purple: str = "#a78bfa"           # Roxo para badges

    # Cores semanticas
    success: str = "#10b981"          # Verde sucesso
    success_bg: str = "#064e3b"       # Fundo verde
    warning: str = "#f59e0b"          # Amarelo aviso
    warning_bg: str = "#451a03"       # Fundo amarelo
    error: str = "#ef4444"            # Vermelho erro
    error_bg: str = "#450a0a"         # Fundo vermelho
    info: str = "#3b82f6"             # Azul info

    # Cores de mensagens
    user_text: str = "#bfdbfe"        # Texto do usuario (azul claro)
    ai_text: str = "#d1fae5"          # Texto da IA (verde claro)
    meta_text: str = "#6b7280"        # Metadados

    # Espacamentos
    radius_sm: int = 6
    radius_md: int = 10
    radius_lg: int = 14
    radius_xl: int = 20

    spacing_xs: int = 4
    spacing_sm: int = 8
    spacing_md: int = 12
    spacing_lg: int = 16
    spacing_xl: int = 24

    # Fontes
    font_family: str = "Segoe UI"
    font_family_mono: str = "Cascadia Code"
    
    font_xs: tuple[str, int] = ("Segoe UI", 9)
    font_sm: tuple[str, int] = ("Segoe UI", 10)
    font_base: tuple[str, int] = ("Segoe UI", 11)
    font_md: tuple[str, int] = ("Segoe UI", 12)
    font_lg: tuple[str, int] = ("Segoe UI", 14)
    font_xl: tuple[str, int] = ("Segoe UI", 16)
    
    font_semibold_sm: tuple[str, int, str] = ("Segoe UI Semibold", 10, "bold")
    font_semibold_base: tuple[str, int, str] = ("Segoe UI Semibold", 11, "bold")
    font_semibold_md: tuple[str, int, str] = ("Segoe UI Semibold", 12, "bold")
    font_semibold_lg: tuple[str, int, str] = ("Segoe UI Semibold", 14, "bold")
    
    font_logo: tuple[str, int, str] = ("Segoe UI Semibold", 18, "bold")
    font_chat: tuple[str, int] = ("Segoe UI", 11)
    font_code: tuple[str, int] = ("Cascadia Code", 10)

    # Sombras (simuladas com bordas no tkinter)
    shadow_color: str = "#000000"


def get_theme() -> Theme:
    """Retorna a instancia do tema atual."""
    return Theme()
