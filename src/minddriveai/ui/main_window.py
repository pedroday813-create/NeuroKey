"""
MindDriveAI - Aplicacao Desktop Principal

Interface desktop moderna com suporte a multiplos provedores de IA
(Google Gemini e OpenAI/ChatGPT).
"""

from __future__ import annotations

import os
import queue
import threading
import tkinter as tk
from datetime import datetime
from tkinter import END, LEFT, RIGHT, VERTICAL, messagebox, simpledialog, ttk
from typing import Literal

from minddriveai.ai.base_provider import AIProvider
from minddriveai.ai.provider_factory import ProviderFactory, ProviderType
from minddriveai.ai.provider_validator import ProviderValidator
from minddriveai.config.paths import build_paths
from minddriveai.core.exceptions import (
    AuthenticationError,
    OfflineError,
    RateLimitError,
    SafetyBlockedError,
)
from minddriveai.core.summarizer import build_summary_prompt
from minddriveai.ops.logging_config import configure_logging
from minddriveai.security.secrets_store import SecretStore
from minddriveai.storage.db import Database
from minddriveai.storage.repositories import (
    ConversationRepository,
    MessageRepository,
    MetricsRepository,
    SettingsRepository,
    SummaryRepository,
)
from minddriveai.ui.theme import get_theme


StatusType = Literal["ready", "loading", "error", "info", "warning", "success"]


class MindDriveApp:
    """
    Aplicacao principal do MindDriveAI.
    Interface desktop moderna com integracao a multiplos provedores de IA.
    """

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("MindDriveAI")
        self.root.geometry("1400x900")
        self.root.minsize(1100, 750)

        self.theme = get_theme()
        self.root.configure(bg=self.theme.bg_app)

        # Configurar estilo
        self._setup_styles()

        # Inicializar servicos
        self.paths = build_paths()
        self.logger = configure_logging(self.paths.logs_dir / "app.log")
        self.db = Database(self.paths.db_path)

        # Repositorios
        self.conv_repo = ConversationRepository(self.db)
        self.msg_repo = MessageRepository(self.db)
        self.summary_repo = SummaryRepository(self.db)
        self.settings_repo = SettingsRepository(self.db)
        self.metrics_repo = MetricsRepository(self.db)
        self.settings = self.settings_repo.get_settings()

        # Seguranca
        self.secret_store = SecretStore(self.paths.secret_path)

        # Estado do provider
        self.provider: AIProvider | None = None
        self.current_provider_type: ProviderType = ProviderType.GEMINI
        self.current_conversation_id: str | None = None
        self.stop_flag = [False]
        self.ui_queue: queue.Queue[tuple[str, str]] = queue.Queue()
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", self._on_search_change)

        # Construir UI
        self._build_ui()
        self._load_conversations()
        self._show_provider_setup()
        self._poll_queue()

    def _setup_styles(self) -> None:
        """Configura todos os estilos ttk para a aplicacao."""
        style = ttk.Style(self.root)
        style.theme_use("clam")

        # Frames
        style.configure("App.TFrame", background=self.theme.bg_app)
        style.configure("Sidebar.TFrame", background=self.theme.bg_sidebar)
        style.configure("Panel.TFrame", background=self.theme.bg_panel)
        style.configure("Card.TFrame", background=self.theme.bg_card)
        style.configure("Input.TFrame", background=self.theme.bg_input)

        # Labels
        style.configure(
            "Logo.TLabel",
            background=self.theme.bg_sidebar,
            foreground=self.theme.text_primary,
            font=self.theme.font_logo,
        )
        style.configure(
            "Tagline.TLabel",
            background=self.theme.bg_sidebar,
            foreground=self.theme.text_muted,
            font=self.theme.font_sm,
        )
        style.configure(
            "SectionTitle.TLabel",
            background=self.theme.bg_sidebar,
            foreground=self.theme.text_secondary,
            font=self.theme.font_semibold_sm,
        )
        style.configure(
            "Status.TLabel",
            background=self.theme.bg_panel,
            foreground=self.theme.text_secondary,
            font=self.theme.font_sm,
        )
        style.configure(
            "WelcomeTitle.TLabel",
            background=self.theme.bg_card,
            foreground=self.theme.text_primary,
            font=self.theme.font_semibold_lg,
        )
        style.configure(
            "WelcomeText.TLabel",
            background=self.theme.bg_card,
            foreground=self.theme.text_secondary,
            font=self.theme.font_base,
        )
        style.configure(
            "EmptyState.TLabel",
            background=self.theme.bg_card,
            foreground=self.theme.text_muted,
            font=self.theme.font_base,
        )

        # Botao Primario (Nova Conversa)
        style.configure(
            "Primary.TButton",
            background=self.theme.accent,
            foreground="#ffffff",
            bordercolor=self.theme.accent,
            focusthickness=0,
            font=self.theme.font_semibold_base,
            padding=(16, 10),
        )
        style.map(
            "Primary.TButton",
            background=[
                ("active", self.theme.accent_hover),
                ("pressed", "#1d4ed8"),
            ],
            foreground=[("disabled", "#6b7280")],
        )

        # Botao Secundario
        style.configure(
            "Secondary.TButton",
            background=self.theme.bg_card,
            foreground=self.theme.text_primary,
            bordercolor=self.theme.border,
            focusthickness=0,
            font=self.theme.font_sm,
            padding=(12, 8),
        )
        style.map(
            "Secondary.TButton",
            background=[
                ("active", self.theme.bg_hover),
                ("pressed", self.theme.bg_active),
            ],
            bordercolor=[("active", self.theme.accent)],
        )

        # Botao de Perigo (Excluir)
        style.configure(
            "Danger.TButton",
            background=self.theme.error_bg,
            foreground="#fca5a5",
            bordercolor="#7f1d1d",
            focusthickness=0,
            font=self.theme.font_sm,
            padding=(12, 8),
        )
        style.map(
            "Danger.TButton",
            background=[
                ("active", "#581c1c"),
                ("pressed", "#6f2424"),
            ],
        )

        # Botao de Aviso (Parar)
        style.configure(
            "Warning.TButton",
            background=self.theme.warning_bg,
            foreground="#fde68a",
            bordercolor="#92400e",
            focusthickness=0,
            font=self.theme.font_sm,
            padding=(12, 8),
        )
        style.map(
            "Warning.TButton",
            background=[
                ("active", "#5c3510"),
                ("pressed", "#6d4112"),
            ],
        )

        # Botao Enviar (destaque especial)
        style.configure(
            "Send.TButton",
            background=self.theme.accent,
            foreground="#ffffff",
            bordercolor=self.theme.accent,
            focusthickness=0,
            font=self.theme.font_semibold_base,
            padding=(20, 10),
        )
        style.map(
            "Send.TButton",
            background=[
                ("active", self.theme.accent_hover),
                ("pressed", "#1d4ed8"),
            ],
        )

        # Botao Ghost (minimalista)
        style.configure(
            "Ghost.TButton",
            background=self.theme.bg_sidebar,
            foreground=self.theme.text_secondary,
            bordercolor=self.theme.bg_sidebar,
            focusthickness=0,
            font=self.theme.font_sm,
            padding=(8, 6),
        )
        style.map(
            "Ghost.TButton",
            background=[
                ("active", self.theme.bg_hover),
            ],
            foreground=[
                ("active", self.theme.text_primary),
            ],
        )

        # Separador
        style.configure(
            "Custom.TSeparator",
            background=self.theme.border,
        )

    def _build_ui(self) -> None:
        """Constroi toda a interface do usuario."""
        # Container principal com padding
        main_container = ttk.Frame(self.root, style="App.TFrame", padding=0)
        main_container.pack(fill=tk.BOTH, expand=True)

        # Layout horizontal: Sidebar + Main
        content = ttk.Frame(main_container, style="App.TFrame")
        content.pack(fill=tk.BOTH, expand=True)

        # === SIDEBAR ===
        self._build_sidebar(content)

        # === MAIN PANEL ===
        self._build_main_panel(content)

    def _build_sidebar(self, parent: ttk.Frame) -> None:
        """Constroi a sidebar com lista de conversas."""
        sidebar = tk.Frame(
            parent,
            bg=self.theme.bg_sidebar,
            width=300,
        )
        sidebar.pack(side=LEFT, fill=tk.Y)
        sidebar.pack_propagate(False)

        # Container interno com padding
        sidebar_inner = tk.Frame(sidebar, bg=self.theme.bg_sidebar)
        sidebar_inner.pack(fill=tk.BOTH, expand=True, padx=16, pady=16)

        # === HEADER ===
        header = tk.Frame(sidebar_inner, bg=self.theme.bg_sidebar)
        header.pack(fill=tk.X, pady=(0, 20))

        # Logo
        logo_frame = tk.Frame(header, bg=self.theme.bg_sidebar)
        logo_frame.pack(fill=tk.X)

        logo_icon = tk.Label(
            logo_frame,
            text="◆",
            font=("Segoe UI", 20),
            fg=self.theme.accent,
            bg=self.theme.bg_sidebar,
        )
        logo_icon.pack(side=LEFT, padx=(0, 8))

        logo_text = tk.Label(
            logo_frame,
            text="MindDriveAI",
            font=self.theme.font_logo,
            fg=self.theme.text_primary,
            bg=self.theme.bg_sidebar,
        )
        logo_text.pack(side=LEFT)

        # Tagline
        tagline = tk.Label(
            header,
            text="Assistente de IA local",
            font=self.theme.font_sm,
            fg=self.theme.text_muted,
            bg=self.theme.bg_sidebar,
        )
        tagline.pack(anchor="w", pady=(4, 0))

        # === PROVIDER INDICATOR ===
        self.provider_frame = tk.Frame(
            sidebar_inner,
            bg=self.theme.bg_card,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        self.provider_frame.pack(fill=tk.X, pady=(0, 12))

        provider_inner = tk.Frame(self.provider_frame, bg=self.theme.bg_card)
        provider_inner.pack(fill=tk.X, padx=10, pady=8)

        self.provider_indicator = tk.Label(
            provider_inner,
            text="●",
            font=("Segoe UI", 8),
            fg=self.theme.warning,
            bg=self.theme.bg_card,
        )
        self.provider_indicator.pack(side=LEFT, padx=(0, 6))

        self.provider_label = tk.Label(
            provider_inner,
            text="Nenhum provider configurado",
            font=self.theme.font_xs,
            fg=self.theme.text_secondary,
            bg=self.theme.bg_card,
        )
        self.provider_label.pack(side=LEFT, fill=tk.X, expand=True)

        config_btn = tk.Button(
            provider_inner,
            text="Configurar",
            font=self.theme.font_xs,
            fg=self.theme.accent,
            bg=self.theme.bg_card,
            activebackground=self.theme.bg_hover,
            activeforeground=self.theme.accent,
            relief="flat",
            cursor="hand2",
            command=self._show_provider_config,
        )
        config_btn.pack(side=RIGHT)

        # === BOTAO NOVA CONVERSA ===
        new_btn = ttk.Button(
            sidebar_inner,
            text="+ Nova Conversa",
            style="Primary.TButton",
            command=self.new_conversation,
        )
        new_btn.pack(fill=tk.X, pady=(0, 16))

        # === BUSCA ===
        search_frame = tk.Frame(
            sidebar_inner,
            bg=self.theme.bg_card,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        search_frame.pack(fill=tk.X, pady=(0, 12))

        search_icon = tk.Label(
            search_frame,
            text="Q",
            font=("Segoe UI", 9),
            fg=self.theme.text_muted,
            bg=self.theme.bg_card,
        )
        search_icon.pack(side=LEFT, padx=(10, 4), pady=8)

        self.search_entry = tk.Entry(
            search_frame,
            textvariable=self.search_var,
            font=self.theme.font_sm,
            fg=self.theme.text_primary,
            bg=self.theme.bg_card,
            insertbackground=self.theme.text_primary,
            relief="flat",
            border=0,
        )
        self.search_entry.pack(side=LEFT, fill=tk.X, expand=True, padx=(0, 10), pady=8)
        self._add_placeholder(self.search_entry, "Buscar conversas...")

        # === SECAO CONVERSAS ===
        section_header = tk.Frame(sidebar_inner, bg=self.theme.bg_sidebar)
        section_header.pack(fill=tk.X, pady=(8, 8))

        section_title = tk.Label(
            section_header,
            text="CONVERSAS",
            font=self.theme.font_semibold_sm,
            fg=self.theme.text_muted,
            bg=self.theme.bg_sidebar,
        )
        section_title.pack(side=LEFT)

        self.conv_count_label = tk.Label(
            section_header,
            text="0",
            font=self.theme.font_xs,
            fg=self.theme.text_muted,
            bg=self.theme.bg_hover,
            padx=6,
            pady=2,
        )
        self.conv_count_label.pack(side=RIGHT)

        # === LISTA DE CONVERSAS ===
        list_container = tk.Frame(
            sidebar_inner,
            bg=self.theme.bg_card,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        list_container.pack(fill=tk.BOTH, expand=True)

        # Scrollbar
        list_scroll = ttk.Scrollbar(list_container, orient=VERTICAL)
        list_scroll.pack(side=RIGHT, fill=tk.Y)

        self.conversation_list = tk.Listbox(
            list_container,
            bg=self.theme.bg_card,
            fg=self.theme.text_primary,
            selectbackground=self.theme.bg_active,
            selectforeground=self.theme.text_primary,
            activestyle="none",
            relief="flat",
            borderwidth=0,
            highlightthickness=0,
            font=self.theme.font_base,
            yscrollcommand=list_scroll.set,
        )
        self.conversation_list.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)
        list_scroll.config(command=self.conversation_list.yview)

        self.conversation_list.bind("<<ListboxSelect>>", lambda _: self.open_selected_conversation())

        # Estado vazio
        self.empty_state = tk.Frame(list_container, bg=self.theme.bg_card)
        self.empty_label = tk.Label(
            self.empty_state,
            text="Nenhuma conversa ainda\n\nClique em '+ Nova Conversa'\npara comecar",
            font=self.theme.font_sm,
            fg=self.theme.text_muted,
            bg=self.theme.bg_card,
            justify="center",
        )
        self.empty_label.pack(expand=True)

        # === BOTOES DE ACAO ===
        action_frame = tk.Frame(sidebar_inner, bg=self.theme.bg_sidebar)
        action_frame.pack(fill=tk.X, pady=(12, 0))

        ttk.Button(
            action_frame,
            text="Renomear",
            style="Ghost.TButton",
            command=self.rename_conversation,
        ).pack(side=LEFT, padx=(0, 4))

        ttk.Button(
            action_frame,
            text="Excluir",
            style="Danger.TButton",
            command=self.delete_conversation,
        ).pack(side=LEFT)

    def _build_main_panel(self, parent: ttk.Frame) -> None:
        """Constroi o painel principal com area de chat."""
        main = tk.Frame(parent, bg=self.theme.bg_panel)
        main.pack(side=LEFT, fill=tk.BOTH, expand=True)

        # Container interno
        main_inner = tk.Frame(main, bg=self.theme.bg_panel)
        main_inner.pack(fill=tk.BOTH, expand=True, padx=24, pady=20)

        # === AREA DE CHAT ===
        chat_container = tk.Frame(
            main_inner,
            bg=self.theme.bg_card,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        chat_container.pack(fill=tk.BOTH, expand=True)

        # Chat interno
        chat_inner = tk.Frame(chat_container, bg=self.theme.bg_card)
        chat_inner.pack(fill=tk.BOTH, expand=True, padx=16, pady=16)

        # Texto do chat com scroll
        chat_scroll = ttk.Scrollbar(chat_inner, orient=VERTICAL)
        chat_scroll.pack(side=RIGHT, fill=tk.Y)

        self.chat_text = tk.Text(
            chat_inner,
            wrap="word",
            state="disabled",
            bg=self.theme.bg_card,
            fg=self.theme.text_primary,
            relief="flat",
            borderwidth=0,
            insertbackground=self.theme.text_primary,
            spacing1=4,
            spacing2=2,
            spacing3=8,
            font=self.theme.font_chat,
            padx=8,
            pady=8,
            yscrollcommand=chat_scroll.set,
        )
        chat_scroll.config(command=self.chat_text.yview)
        self.chat_text.pack(side=LEFT, fill=tk.BOTH, expand=True)

        # Tags para formatacao
        self.chat_text.tag_configure(
            "user_label",
            foreground=self.theme.accent_light,
            font=self.theme.font_semibold_base,
            spacing1=16,
        )
        self.chat_text.tag_configure(
            "user",
            foreground=self.theme.user_text,
            lmargin1=0,
            lmargin2=0,
        )
        self.chat_text.tag_configure(
            "ai_label",
            foreground=self.theme.cyan,
            font=self.theme.font_semibold_base,
            spacing1=16,
        )
        self.chat_text.tag_configure(
            "assistant",
            foreground=self.theme.ai_text,
            lmargin1=0,
            lmargin2=0,
        )
        self.chat_text.tag_configure(
            "meta",
            foreground=self.theme.meta_text,
            font=self.theme.font_xs,
        )
        self.chat_text.tag_configure(
            "divider",
            foreground=self.theme.border,
        )

        # === TELA DE BOAS-VINDAS ===
        self.welcome_frame = tk.Frame(chat_inner, bg=self.theme.bg_card)
        
        welcome_content = tk.Frame(self.welcome_frame, bg=self.theme.bg_card)
        welcome_content.place(relx=0.5, rely=0.45, anchor="center")

        welcome_icon = tk.Label(
            welcome_content,
            text="◆",
            font=("Segoe UI", 48),
            fg=self.theme.accent,
            bg=self.theme.bg_card,
        )
        welcome_icon.pack()

        welcome_title = tk.Label(
            welcome_content,
            text="Bem-vindo ao MindDriveAI",
            font=self.theme.font_semibold_lg,
            fg=self.theme.text_primary,
            bg=self.theme.bg_card,
        )
        welcome_title.pack(pady=(16, 8))

        welcome_desc = tk.Label(
            welcome_content,
            text="Seu assistente de IA pessoal com suporte a\nGoogle Gemini e OpenAI (ChatGPT).",
            font=self.theme.font_base,
            fg=self.theme.text_secondary,
            bg=self.theme.bg_card,
            justify="center",
        )
        welcome_desc.pack()

        # Tips
        tips_frame = tk.Frame(welcome_content, bg=self.theme.bg_card)
        tips_frame.pack(pady=(24, 0))

        tips = [
            ("Enter", "Enviar"),
            ("Shift+Enter", "Nova linha"),
            ("Ctrl+N", "Nova conversa"),
        ]

        for key, desc in tips:
            tip = tk.Frame(tips_frame, bg=self.theme.bg_hover, padx=12, pady=6)
            tip.pack(side=LEFT, padx=4)
            
            tk.Label(
                tip,
                text=key,
                font=self.theme.font_semibold_sm,
                fg=self.theme.text_primary,
                bg=self.theme.bg_hover,
            ).pack(side=LEFT, padx=(0, 6))
            
            tk.Label(
                tip,
                text=desc,
                font=self.theme.font_xs,
                fg=self.theme.text_muted,
                bg=self.theme.bg_hover,
            ).pack(side=LEFT)

        # === STATUS BAR ===
        status_frame = tk.Frame(main_inner, bg=self.theme.bg_panel)
        status_frame.pack(fill=tk.X, pady=(12, 12))

        self.status_indicator = tk.Label(
            status_frame,
            text="●",
            font=("Segoe UI", 10),
            fg=self.theme.success,
            bg=self.theme.bg_panel,
        )
        self.status_indicator.pack(side=LEFT, padx=(0, 6))

        self.status_label = tk.Label(
            status_frame,
            text="Pronto",
            font=self.theme.font_sm,
            fg=self.theme.text_secondary,
            bg=self.theme.bg_panel,
            anchor="w",
        )
        self.status_label.pack(side=LEFT, fill=tk.X, expand=True)

        self.token_label = tk.Label(
            status_frame,
            text="",
            font=self.theme.font_xs,
            fg=self.theme.text_muted,
            bg=self.theme.bg_panel,
        )
        self.token_label.pack(side=RIGHT)

        # === INPUT AREA ===
        input_container = tk.Frame(
            main_inner,
            bg=self.theme.bg_input,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        input_container.pack(fill=tk.X)

        input_inner = tk.Frame(input_container, bg=self.theme.bg_input)
        input_inner.pack(fill=tk.X, padx=12, pady=12)

        # Campo de texto
        self.input_text = tk.Text(
            input_inner,
            height=4,
            wrap="word",
            bg=self.theme.bg_input,
            fg=self.theme.text_primary,
            relief="flat",
            borderwidth=0,
            insertbackground=self.theme.cyan,
            font=self.theme.font_base,
            padx=4,
            pady=4,
        )
        self.input_text.pack(fill=tk.X)
        self.input_text.bind("<Return>", self._on_enter)
        self.input_text.bind("<Shift-Return>", self._on_shift_enter)
        self._add_placeholder(self.input_text, "Digite sua mensagem... (Enter para enviar)")

        # Focus no input
        self.input_text.focus_set()

        # === BOTOES DE ACAO ===
        action_bar = tk.Frame(main_inner, bg=self.theme.bg_panel)
        action_bar.pack(fill=tk.X, pady=(12, 0))

        # Lado esquerdo
        left_actions = tk.Frame(action_bar, bg=self.theme.bg_panel)
        left_actions.pack(side=LEFT)

        ttk.Button(
            left_actions,
            text="Enviar",
            style="Send.TButton",
            command=self.send_message,
        ).pack(side=LEFT, padx=(0, 8))

        ttk.Button(
            left_actions,
            text="Parar",
            style="Warning.TButton",
            command=self.stop_generation,
        ).pack(side=LEFT)

        # Lado direito
        right_actions = tk.Frame(action_bar, bg=self.theme.bg_panel)
        right_actions.pack(side=RIGHT)

        ttk.Button(
            right_actions,
            text="Exportar TXT",
            style="Secondary.TButton",
            command=self.export_txt,
        ).pack(side=LEFT, padx=(0, 8))

        ttk.Button(
            right_actions,
            text="Exportar MD",
            style="Secondary.TButton",
            command=self.export_md,
        ).pack(side=LEFT)

        # Atalhos de teclado
        self.root.bind("<Control-n>", lambda _: self.new_conversation())
        self.root.bind("<Control-N>", lambda _: self.new_conversation())

    def _add_placeholder(self, widget: tk.Entry | tk.Text, placeholder: str) -> None:
        """Adiciona placeholder a um widget de entrada."""
        is_text = isinstance(widget, tk.Text)

        def on_focus_in(_: tk.Event[tk.Entry | tk.Text]) -> None:
            current = widget.get("1.0", END).strip() if is_text else widget.get()
            if current == placeholder:
                if is_text:
                    widget.delete("1.0", END)
                else:
                    widget.delete(0, END)
                widget.config(fg=self.theme.text_primary)

        def on_focus_out(_: tk.Event[tk.Entry | tk.Text]) -> None:
            current = widget.get("1.0", END).strip() if is_text else widget.get()
            if not current:
                if is_text:
                    widget.insert("1.0", placeholder)
                else:
                    widget.insert(0, placeholder)
                widget.config(fg=self.theme.text_placeholder)

        # Definir estado inicial
        if is_text:
            widget.insert("1.0", placeholder)
        else:
            widget.insert(0, placeholder)
        widget.config(fg=self.theme.text_placeholder)

        widget.bind("<FocusIn>", on_focus_in)
        widget.bind("<FocusOut>", on_focus_out)

    def _on_search_change(self, *_: object) -> None:
        """Filtra a lista de conversas com base na busca."""
        query = self.search_var.get().lower().strip()
        self.conversation_list.delete(0, END)

        filtered = [
            c for c in self.conversations
            if not query or query in c.title.lower()
        ]

        for convo in filtered:
            self.conversation_list.insert(END, f"  {convo.title}")

        self._update_empty_state(len(filtered) == 0)
        self.conv_count_label.config(text=str(len(filtered)))

    def _update_empty_state(self, is_empty: bool) -> None:
        """Mostra ou esconde o estado vazio."""
        if is_empty:
            self.empty_state.place(relx=0.5, rely=0.5, anchor="center")
        else:
            self.empty_state.place_forget()

    def _show_welcome(self) -> None:
        """Mostra a tela de boas-vindas."""
        self.chat_text.pack_forget()
        self.welcome_frame.pack(fill=tk.BOTH, expand=True)

    def _hide_welcome(self) -> None:
        """Esconde a tela de boas-vindas."""
        self.welcome_frame.pack_forget()
        self.chat_text.pack(side=LEFT, fill=tk.BOTH, expand=True)

    def _set_status(self, text: str, state: StatusType = "ready") -> None:
        """Atualiza a barra de status."""
        colors = {
            "ready": self.theme.success,
            "loading": self.theme.warning,
            "error": self.theme.error,
            "info": self.theme.accent,
            "warning": self.theme.warning,
            "success": self.theme.success,
        }
        color = colors.get(state, self.theme.text_secondary)
        self.status_indicator.config(fg=color)
        self.status_label.config(text=text)

    def _update_provider_indicator(self) -> None:
        """Atualiza o indicador de provider na sidebar."""
        if self.provider:
            self.provider_indicator.config(fg=self.theme.success)
            self.provider_label.config(
                text=f"{self.current_provider_type.display_name}"
            )
        else:
            self.provider_indicator.config(fg=self.theme.warning)
            self.provider_label.config(text="Nenhum provider configurado")

    def _show_provider_setup(self) -> None:
        """Mostra dialogo de configuracao de provider no inicio."""
        # Primeiro tenta carregar de variaveis de ambiente
        for provider_type in ProviderType:
            env_key = os.getenv(provider_type.env_var_name)
            if env_key:
                try:
                    self.provider = ProviderFactory.create(provider_type, env_key)
                    self.current_provider_type = provider_type
                    self._update_provider_indicator()
                    self._set_status(f"API key do {provider_type.display_name} carregada por variavel de ambiente", "info")
                    return
                except Exception:
                    continue

        # Se nao encontrou em env, tenta carregar do secrets_store
        if self.secret_store.exists():
            ask_saved = messagebox.askyesno(
                "MindDriveAI",
                "Usar API key salva criptografada?",
            )
            if ask_saved:
                pwd = simpledialog.askstring(
                    "Senha Local",
                    "Digite a senha local:",
                    show="*",
                )
                if pwd:
                    try:
                        api_key = self.secret_store.load_api_key(pwd)
                        # Por padrao tenta Gemini primeiro
                        self.provider = ProviderFactory.create(ProviderType.GEMINI, api_key)
                        self.current_provider_type = ProviderType.GEMINI
                        self._update_provider_indicator()
                        self._set_status("API key criptografada carregada", "info")
                        return
                    except Exception as exc:
                        messagebox.showerror("Erro", f"Falha ao carregar chave: {exc}")

        # Se nao conseguiu, mostra configurador
        self._show_provider_config()

    def _show_provider_config(self) -> None:
        """Mostra dialogo de configuracao de provider."""
        config_win = tk.Toplevel(self.root)
        config_win.title("Configurar Provider de IA")
        config_win.geometry("500x500")
        config_win.configure(bg=self.theme.bg_panel)
        config_win.transient(self.root)
        config_win.grab_set()
        
        # Centralizar
        config_win.update_idletasks()
        x = (config_win.winfo_screenwidth() // 2) - (500 // 2)
        y = (config_win.winfo_screenheight() // 2) - (500 // 2)
        config_win.geometry(f"+{x}+{y}")

        # Container
        container = tk.Frame(config_win, bg=self.theme.bg_panel)
        container.pack(fill=tk.BOTH, expand=True, padx=24, pady=24)

        # Titulo
        tk.Label(
            container,
            text="Configurar Provider de IA",
            font=self.theme.font_semibold_lg,
            fg=self.theme.text_primary,
            bg=self.theme.bg_panel,
        ).pack(anchor="w")

        tk.Label(
            container,
            text="Selecione o provider e insira sua API key.",
            font=self.theme.font_sm,
            fg=self.theme.text_secondary,
            bg=self.theme.bg_panel,
        ).pack(anchor="w", pady=(4, 20))

        # Provider selection
        provider_var = tk.StringVar(value=self.current_provider_type.value)

        tk.Label(
            container,
            text="Provider",
            font=self.theme.font_semibold_sm,
            fg=self.theme.text_primary,
            bg=self.theme.bg_panel,
        ).pack(anchor="w")

        for ptype in ProviderType:
            rb_frame = tk.Frame(container, bg=self.theme.bg_panel)
            rb_frame.pack(fill=tk.X, pady=4)
            
            rb = tk.Radiobutton(
                rb_frame,
                text=ptype.display_name,
                variable=provider_var,
                value=ptype.value,
                font=self.theme.font_base,
                fg=self.theme.text_primary,
                bg=self.theme.bg_panel,
                selectcolor=self.theme.bg_card,
                activebackground=self.theme.bg_panel,
                activeforeground=self.theme.text_primary,
            )
            rb.pack(side=LEFT)

        # API Key
        tk.Label(
            container,
            text="API Key",
            font=self.theme.font_semibold_sm,
            fg=self.theme.text_primary,
            bg=self.theme.bg_panel,
        ).pack(anchor="w", pady=(16, 4))

        key_frame = tk.Frame(
            container,
            bg=self.theme.bg_card,
            highlightbackground=self.theme.border,
            highlightthickness=1,
        )
        key_frame.pack(fill=tk.X)

        key_entry = tk.Entry(
            key_frame,
            font=self.theme.font_base,
            fg=self.theme.text_primary,
            bg=self.theme.bg_card,
            insertbackground=self.theme.text_primary,
            relief="flat",
            show="*",
        )
        key_entry.pack(fill=tk.X, padx=10, pady=10)

        # Hint
        hint_label = tk.Label(
            container,
            text=ProviderType.GEMINI.api_key_hint,
            font=self.theme.font_xs,
            fg=self.theme.text_muted,
            bg=self.theme.bg_panel,
            wraplength=450,
        )
        hint_label.pack(anchor="w", pady=(4, 0))

        # Atualizar hint quando provider muda
        def update_hint(*_: object) -> None:
            try:
                ptype = ProviderType.from_string(provider_var.get())
                hint_label.config(text=ptype.api_key_hint)
            except ValueError:
                pass

        provider_var.trace_add("write", update_hint)

        # Status de validacao
        status_frame = tk.Frame(container, bg=self.theme.bg_panel)
        status_frame.pack(fill=tk.X, pady=(16, 0))

        status_indicator = tk.Label(
            status_frame,
            text="",
            font=self.theme.font_sm,
            fg=self.theme.text_muted,
            bg=self.theme.bg_panel,
        )
        status_indicator.pack(anchor="w")

        # Botoes
        btn_frame = tk.Frame(container, bg=self.theme.bg_panel)
        btn_frame.pack(fill=tk.X, pady=(20, 0))

        def validate_and_save() -> None:
            api_key = key_entry.get().strip()
            try:
                ptype = ProviderType.from_string(provider_var.get())
            except ValueError:
                status_indicator.config(text="Selecione um provider valido.", fg=self.theme.error)
                return

            if not api_key:
                status_indicator.config(text="Insira a API key.", fg=self.theme.error)
                return

            # Validar formato
            format_result = ProviderValidator.validate_key_format(ptype, api_key)
            if not format_result.is_valid:
                status_indicator.config(
                    text=f"{format_result.message}\n{format_result.details}",
                    fg=self.theme.error,
                )
                return

            status_indicator.config(text="Validando online...", fg=self.theme.warning)
            config_win.update()

            # Validar online
            online_result = ProviderValidator.validate_key_online(ptype, api_key)
            if not online_result.is_valid:
                status_indicator.config(
                    text=f"{online_result.message}",
                    fg=self.theme.error,
                )
                return

            # Sucesso - criar provider
            try:
                self.provider = ProviderFactory.create(ptype, api_key)
                self.current_provider_type = ptype
                self._update_provider_indicator()
                self._set_status(f"{ptype.display_name} configurado com sucesso!", "success")

                # Perguntar se quer salvar
                should_save = messagebox.askyesno(
                    "Salvar Chave",
                    "Deseja salvar a API key criptografada localmente?\n\n"
                    "Isso permite usar o app sem digitar a chave novamente.",
                    parent=config_win,
                )
                if should_save:
                    pwd = simpledialog.askstring(
                        "Criar Senha",
                        "Crie uma senha local para proteger sua chave:",
                        show="*",
                        parent=config_win,
                    )
                    if pwd:
                        self.secret_store.save_api_key(api_key, pwd)
                        messagebox.showinfo("Salvo", "API key salva com sucesso!", parent=config_win)

                config_win.destroy()

            except Exception as exc:
                status_indicator.config(text=f"Erro ao criar provider: {exc}", fg=self.theme.error)

        ttk.Button(
            btn_frame,
            text="Validar e Salvar",
            style="Primary.TButton",
            command=validate_and_save,
        ).pack(side=LEFT, padx=(0, 8))

        ttk.Button(
            btn_frame,
            text="Cancelar",
            style="Secondary.TButton",
            command=config_win.destroy,
        ).pack(side=LEFT)

        # Opcao de usar sem key (modo limitado)
        def use_without_key() -> None:
            self._set_status("Sem provider configurado - envio desabilitado", "warning")
            self._update_provider_indicator()
            config_win.destroy()

        tk.Button(
            container,
            text="Continuar sem API key (modo somente leitura)",
            font=self.theme.font_xs,
            fg=self.theme.text_muted,
            bg=self.theme.bg_panel,
            activebackground=self.theme.bg_panel,
            activeforeground=self.theme.text_secondary,
            relief="flat",
            cursor="hand2",
            command=use_without_key,
        ).pack(anchor="w", pady=(16, 0))

    def _poll_queue(self) -> None:
        """Processa eventos da fila de UI."""
        while True:
            try:
                kind, payload = self.ui_queue.get_nowait()
            except queue.Empty:
                break

            if kind == "chunk":
                self._append_chat(payload, "assistant", newline=False)
            elif kind == "done":
                self._set_status("Pronto", "ready")
                self._append_chat("\n", "meta", newline=False)
            elif kind == "status":
                self._set_status(payload, "info")
            elif kind == "tokens":
                self.token_label.config(text=payload)
            elif kind == "error":
                self._set_status("Erro", "error")
                messagebox.showerror("Erro", payload)

        self.root.after(60, self._poll_queue)

    def _append_chat(self, text: str, tag: str, newline: bool = True) -> None:
        """Adiciona texto a area de chat."""
        self.chat_text.configure(state="normal")
        content = text + ("\n" if newline else "")
        self.chat_text.insert(END, content, tag)
        self.chat_text.see(END)
        self.chat_text.configure(state="disabled")

    def _on_enter(self, event: tk.Event[tk.Text]) -> str:
        """Handler para tecla Enter."""
        state = int(event.state) if isinstance(event.state, int) else 0
        if state & 0x1:  # Shift pressionado
            return ""  # Permite nova linha
        self.send_message()
        return "break"

    def _on_shift_enter(self, _: tk.Event[tk.Text]) -> str:
        """Handler para Shift+Enter."""
        return ""  # Permite nova linha

    def _load_conversations(self) -> None:
        """Carrega lista de conversas."""
        self.conversation_list.delete(0, END)
        self.conversations = self.conv_repo.list_all()

        for convo in self.conversations:
            self.conversation_list.insert(END, f"  {convo.title}")

        self._update_empty_state(len(self.conversations) == 0)
        self.conv_count_label.config(text=str(len(self.conversations)))

        # Mostrar tela de boas-vindas se nao houver conversa selecionada
        if not self.current_conversation_id:
            self._show_welcome()

    def new_conversation(self) -> None:
        """Cria uma nova conversa."""
        title = simpledialog.askstring(
            "Nova Conversa",
            "Titulo da conversa:",
        ) or "Nova conversa"

        convo = self.conv_repo.create(title, self.settings)
        self._load_conversations()
        self.current_conversation_id = convo.id

        # Limpar chat e esconder welcome
        self._hide_welcome()
        self.chat_text.configure(state="normal")
        self.chat_text.delete("1.0", END)
        self.chat_text.configure(state="disabled")

        # Selecionar na lista
        for i, c in enumerate(self.conversations):
            if c.id == convo.id:
                self.conversation_list.selection_clear(0, END)
                self.conversation_list.selection_set(i)
                self.conversation_list.see(i)
                break

        # Focar no input
        self.input_text.focus_set()

    def open_selected_conversation(self) -> None:
        """Abre a conversa selecionada."""
        selection = self.conversation_list.curselection()
        if not selection:
            return

        idx = selection[0]
        convo = self.conversations[idx]
        self.current_conversation_id = convo.id

        # Esconder welcome e mostrar chat
        self._hide_welcome()

        # Limpar chat
        self.chat_text.configure(state="normal")
        self.chat_text.delete("1.0", END)
        self.chat_text.configure(state="disabled")

        # Carregar mensagens
        messages = self.msg_repo.list_by_conversation(convo.id)
        for msg in messages:
            if msg.role == "user":
                self._append_chat("Voce", "user_label")
                self._append_chat(msg.content, "user")
            else:
                self._append_chat("MindDriveAI", "ai_label")
                self._append_chat(msg.content, "assistant")

        # Atualizar contagem de tokens
        total = self.msg_repo.total_tokens(convo.id)
        self.token_label.config(text=f"Tokens: {total}")

        # Focar no input
        self.input_text.focus_set()

    def rename_conversation(self) -> None:
        """Renomeia a conversa atual."""
        cid = self.current_conversation_id
        if not cid:
            messagebox.showinfo("Info", "Selecione uma conversa primeiro.")
            return

        title = simpledialog.askstring("Renomear", "Novo titulo:")
        if title:
            self.conv_repo.rename(cid, title)
            self._load_conversations()

    def delete_conversation(self) -> None:
        """Exclui a conversa atual."""
        cid = self.current_conversation_id
        if not cid:
            messagebox.showinfo("Info", "Selecione uma conversa primeiro.")
            return

        if messagebox.askyesno(
            "Confirmar Exclusao",
            "Tem certeza que deseja excluir esta conversa?\n\nEsta acao nao pode ser desfeita.",
        ):
            self.conv_repo.delete(cid)
            self.current_conversation_id = None
            self._load_conversations()
            self._show_welcome()

    def send_message(self) -> None:
        """Envia uma mensagem."""
        if not self.provider:
            self._show_provider_config()
            return

        # Obter texto (ignorar placeholder)
        text = self.input_text.get("1.0", END).strip()
        placeholder = "Digite sua mensagem... (Enter para enviar)"
        if not text or text == placeholder:
            return

        # Criar conversa se necessario
        if not self.current_conversation_id:
            convo = self.conv_repo.create("Nova conversa", self.settings)
            self.current_conversation_id = convo.id
            self._load_conversations()
            self._hide_welcome()

        assert self.current_conversation_id is not None

        # Salvar e mostrar mensagem do usuario
        self.msg_repo.add(self.current_conversation_id, "user", text)
        self._append_chat("Voce", "user_label")
        self._append_chat(text, "user")

        # Preparar resposta
        self._append_chat("MindDriveAI", "ai_label")

        # Limpar input
        self.input_text.delete("1.0", END)
        self._add_placeholder(self.input_text, "Digite sua mensagem... (Enter para enviar)")

        # Atualizar status
        self._set_status("Gerando resposta...", "loading")
        self.stop_flag[0] = False

        # Iniciar worker
        worker = threading.Thread(
            target=self._generate_worker,
            args=(self.current_conversation_id, text),
            daemon=True,
        )
        worker.start()

    def _build_history(self, conversation_id: str) -> list[dict[str, object]]:
        """Constroi historico de mensagens para a API."""
        messages = self.msg_repo.list_by_conversation(conversation_id)
        limit = self.settings.context_window_messages
        old_messages = messages[:-limit] if len(messages) > limit else []
        recent = messages[-limit:]

        history: list[dict[str, object]] = []

        if old_messages:
            latest_summary = self.summary_repo.latest_for_conversation(conversation_id)
            if latest_summary is None:
                prompt = build_summary_prompt(old_messages)
                summary_text = f"Resumo do contexto anterior: {prompt[:1800]}"
                self.summary_repo.add(conversation_id, summary_text)
                history.append({"role": "model", "parts": [{"text": summary_text}]})
            else:
                history.append({"role": "model", "parts": [{"text": latest_summary.summary}]})

        for msg in recent[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [{"text": msg.content}]})

        return history

    def _generate_worker(self, conversation_id: str, user_text: str) -> None:
        """Worker thread para geracao de resposta."""
        try:
            assert self.provider is not None
            history = self._build_history(conversation_id)

            # Determinar modelo baseado no provider
            model = self.settings.model
            if self.current_provider_type == ProviderType.OPENAI:
                # Se o modelo configurado e do Gemini, usar padrao do OpenAI
                if "gemini" in model.lower():
                    model = self.provider.default_model

            generator = self.provider.stream_reply(
                model=model,
                history=history,
                user_text=user_text,
                temperature=self.settings.temperature,
                max_output_tokens=self.settings.max_output_tokens,
                stop_flag=self.stop_flag,
            )

            result = None
            while True:
                try:
                    piece = next(generator)
                    self.ui_queue.put(("chunk", piece))
                except StopIteration as stop:
                    result = stop.value
                    break

            if result and not self.stop_flag[0]:
                self.msg_repo.add(
                    conversation_id,
                    "assistant",
                    result.text,
                    token_in=result.token_in,
                    token_out=result.token_out,
                    token_total=result.token_total,
                )
                day = datetime.utcnow().strftime("%Y-%m-%d")
                self.metrics_repo.record(day, result.token_in, result.token_out, is_error=False)

                total = self.msg_repo.total_tokens(conversation_id)
                self.ui_queue.put(("tokens", f"Tokens: {total}"))
                self.ui_queue.put(("status", "Pronto"))

            self.ui_queue.put(("done", ""))

        except (OfflineError, AuthenticationError, RateLimitError, SafetyBlockedError) as exc:
            day = datetime.utcnow().strftime("%Y-%m-%d")
            self.metrics_repo.record(day, 0, 0, is_error=True)
            
            # Diagnosticar erro
            diagnosis = ProviderValidator.diagnose_error(str(exc))
            self.ui_queue.put(("error", f"{exc}\n\n{diagnosis}"))
        except Exception as exc:
            self.logger.exception("Erro nao tratado")
            self.ui_queue.put(("error", f"Erro inesperado: {exc}"))

    def stop_generation(self) -> None:
        """Para a geracao atual."""
        self.stop_flag[0] = True
        self._set_status("Geracao interrompida", "warning")

    def _export(self, ext: str) -> None:
        """Exporta a conversa atual."""
        cid = self.current_conversation_id
        if not cid:
            messagebox.showinfo("Info", "Selecione uma conversa primeiro.")
            return

        messages = self.msg_repo.list_by_conversation(cid)
        if not messages:
            messagebox.showinfo("Info", "Esta conversa esta vazia.")
            return

        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        out = self.paths.exports_dir / f"conversation_{stamp}.{ext}"

        if ext == "md":
            content = "\n\n".join([f"## {m.role.title()}\n\n{m.content}" for m in messages])
        else:
            content = "\n\n".join([f"[{m.role.upper()}]\n{m.content}" for m in messages])

        out.write_text(content, encoding="utf-8")
        messagebox.showinfo(
            "Exportado",
            f"Conversa exportada com sucesso!\n\n{out}",
        )

    def export_txt(self) -> None:
        """Exporta como TXT."""
        self._export("txt")

    def export_md(self) -> None:
        """Exporta como Markdown."""
        self._export("md")


def run_app() -> None:
    """Inicia a aplicacao MindDriveAI."""
    root = tk.Tk()
    app = MindDriveApp(root)

    def _on_close() -> None:
        app.db.close()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", _on_close)
    root.mainloop()
