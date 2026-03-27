from __future__ import annotations

import os
import queue
import threading
import tkinter as tk
from datetime import datetime
from tkinter import END, LEFT, RIGHT, VERTICAL, messagebox, simpledialog, ttk

from minddriveai.config.paths import build_paths
from minddriveai.core.exceptions import (
    AuthenticationError,
    OfflineError,
    RateLimitError,
    SafetyBlockedError,
)
from minddriveai.core.gemini_service import GeminiService
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


class MindDriveApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("MindDriveAI")
        self.root.geometry("1200x760")

        self.paths = build_paths()
        self.logger = configure_logging(self.paths.logs_dir / "app.log")
        self.db = Database(self.paths.db_path)

        self.conv_repo = ConversationRepository(self.db)
        self.msg_repo = MessageRepository(self.db)
        self.summary_repo = SummaryRepository(self.db)
        self.settings_repo = SettingsRepository(self.db)
        self.metrics_repo = MetricsRepository(self.db)
        self.settings = self.settings_repo.get_settings()

        self.secret_store = SecretStore(self.paths.secret_path)

        self.service: GeminiService | None = None
        self.current_conversation_id: str | None = None
        self.stop_flag = [False]
        self.ui_queue: queue.Queue[tuple[str, str]] = queue.Queue()

        self._build_ui()
        self._load_conversations()
        self._bootstrap_api_key()
        self._poll_queue()

    def _build_ui(self) -> None:
        container = ttk.Panedwindow(self.root, orient=tk.HORIZONTAL)
        container.pack(fill=tk.BOTH, expand=True)

        sidebar = ttk.Frame(container, width=280)
        container.add(sidebar, weight=1)

        main = ttk.Frame(container)
        container.add(main, weight=4)

        btns = ttk.Frame(sidebar)
        btns.pack(fill=tk.X, padx=8, pady=8)
        ttk.Button(btns, text="Nova", command=self.new_conversation).pack(side=LEFT, padx=2)
        ttk.Button(btns, text="Renomear", command=self.rename_conversation).pack(side=LEFT, padx=2)
        ttk.Button(btns, text="Excluir", command=self.delete_conversation).pack(side=LEFT, padx=2)

        self.conversation_list = tk.Listbox(sidebar)
        self.conversation_list.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)
        self.conversation_list.bind(
            "<<ListboxSelect>>", lambda _: self.open_selected_conversation()
        )

        chat_frame = ttk.Frame(main)
        chat_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self.chat_text = tk.Text(chat_frame, wrap="word", state="disabled")
        chat_scroll = ttk.Scrollbar(chat_frame, orient=VERTICAL, command=self.chat_text.yview)
        self.chat_text.configure(yscrollcommand=chat_scroll.set)
        self.chat_text.pack(side=LEFT, fill=tk.BOTH, expand=True)
        chat_scroll.pack(side=RIGHT, fill=tk.Y)

        self.status_label = ttk.Label(main, text="Pronto")
        self.status_label.pack(fill=tk.X, padx=8, pady=4)

        input_frame = ttk.Frame(main)
        input_frame.pack(fill=tk.X, padx=8, pady=8)
        self.input_text = tk.Text(input_frame, height=4, wrap="word")
        self.input_text.pack(fill=tk.X, side=LEFT, expand=True)
        self.input_text.bind("<Return>", self._on_enter)
        self.input_text.bind("<Shift-Return>", self._on_shift_enter)

        actions = ttk.Frame(main)
        actions.pack(fill=tk.X, padx=8, pady=8)
        ttk.Button(actions, text="Enviar", command=self.send_message).pack(side=LEFT)
        ttk.Button(actions, text="Parar geração", command=self.stop_generation).pack(
            side=LEFT, padx=4
        )
        ttk.Button(actions, text="Exportar TXT", command=self.export_txt).pack(side=LEFT, padx=4)
        ttk.Button(actions, text="Exportar MD", command=self.export_md).pack(side=LEFT, padx=4)

    def _bootstrap_api_key(self) -> None:
        env_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if env_key:
            self.service = GeminiService(env_key)
            return

        ask_saved = messagebox.askyesno("MindDriveAI", "Usar API key salva criptografada?")
        if self.secret_store.exists() and ask_saved:
            pwd = simpledialog.askstring("Senha local", "Digite a senha local:", show="*")
            if pwd:
                try:
                    api_key = self.secret_store.load_api_key(pwd)
                    self.service = GeminiService(api_key)
                    return
                except Exception as exc:
                    messagebox.showerror("Erro", f"Falha ao carregar chave: {exc}")

        prompt_key = simpledialog.askstring("Gemini API Key", "Cole sua API key:", show="*")
        if not prompt_key:
            messagebox.showwarning("Sem chave", "Aplicativo iniciado sem API key.")
            return
        should_save = messagebox.askyesno(
            "Salvar chave",
            "Salvar API key criptografada localmente?",
        )
        if should_save:
            pwd = simpledialog.askstring("Senha local", "Crie uma senha local:", show="*")
            if pwd:
                self.secret_store.save_api_key(prompt_key, pwd)
        self.service = GeminiService(prompt_key)

    def _poll_queue(self) -> None:
        while True:
            try:
                kind, payload = self.ui_queue.get_nowait()
            except queue.Empty:
                break

            if kind == "chunk":
                self._append_chat(payload, prefix="", newline=False)
            elif kind == "done":
                self.status_label.config(text="Pronto")
                self._append_chat("\n", prefix="", newline=False)
            elif kind == "status":
                self.status_label.config(text=payload)
            elif kind == "error":
                self.status_label.config(text="Erro")
                messagebox.showerror("Erro", payload)

        self.root.after(80, self._poll_queue)

    def _append_chat(self, text: str, prefix: str = "", newline: bool = True) -> None:
        self.chat_text.configure(state="normal")
        line = f"{prefix}{text}"
        if newline:
            line += "\n"
        self.chat_text.insert(END, line)
        self.chat_text.see(END)
        self.chat_text.configure(state="disabled")

    def _on_enter(self, event: tk.Event[tk.Text]) -> str:
        state = int(event.state) if isinstance(event.state, int) else 0
        if state & 0x1:
            return "break"
        self.send_message()
        return "break"

    def _on_shift_enter(self, _: tk.Event[tk.Text]) -> str:
        self.input_text.insert(END, "\n")
        return "break"

    def _load_conversations(self) -> None:
        self.conversation_list.delete(0, END)
        self.conversations = self.conv_repo.list_all()
        for convo in self.conversations:
            self.conversation_list.insert(END, convo.title)

    def new_conversation(self) -> None:
        title = simpledialog.askstring("Nova conversa", "Título:") or "Nova conversa"
        convo = self.conv_repo.create(title, self.settings)
        self._load_conversations()
        self.current_conversation_id = convo.id

    def open_selected_conversation(self) -> None:
        selection = self.conversation_list.curselection()
        if not selection:
            return
        idx = selection[0]
        convo = self.conversations[idx]
        self.current_conversation_id = convo.id

        self.chat_text.configure(state="normal")
        self.chat_text.delete("1.0", END)
        self.chat_text.configure(state="disabled")

        messages = self.msg_repo.list_by_conversation(convo.id)
        for msg in messages:
            self._append_chat(msg.content, prefix=f"{msg.role.upper()}: ")

    def rename_conversation(self) -> None:
        cid = self.current_conversation_id
        if not cid:
            return
        title = simpledialog.askstring("Renomear", "Novo título:")
        if title:
            self.conv_repo.rename(cid, title)
            self._load_conversations()

    def delete_conversation(self) -> None:
        cid = self.current_conversation_id
        if not cid:
            return
        if messagebox.askyesno("Confirmar", "Excluir conversa selecionada?"):
            self.conv_repo.delete(cid)
            self.current_conversation_id = None
            self._load_conversations()

    def send_message(self) -> None:
        if not self.service:
            messagebox.showwarning("Sem API key", "Configure a API key antes de enviar.")
            return
        text = self.input_text.get("1.0", END).strip()
        if not text:
            return
        if not self.current_conversation_id:
            convo = self.conv_repo.create("Conversa sem título", self.settings)
            self.current_conversation_id = convo.id
            self._load_conversations()

        assert self.current_conversation_id is not None
        self.msg_repo.add(self.current_conversation_id, "user", text)
        self._append_chat(text, prefix="USER: ")
        self._append_chat("ASSISTANT: ", newline=False)
        self.input_text.delete("1.0", END)
        self.status_label.config(text="Gerando...")
        self.stop_flag[0] = False

        worker = threading.Thread(
            target=self._generate_worker,
            args=(self.current_conversation_id, text),
            daemon=True,
        )
        worker.start()

    def _build_history(self, conversation_id: str) -> list[dict[str, object]]:
        messages = self.msg_repo.list_by_conversation(conversation_id)
        limit = self.settings.context_window_messages
        old_messages = messages[:-limit] if len(messages) > limit else []
        recent = messages[-limit:]

        history: list[dict[str, object]] = []
        if old_messages:
            latest_summary = self.summary_repo.latest_for_conversation(conversation_id)
            if latest_summary is None:
                prompt = build_summary_prompt(old_messages)
                summary_text = f"Resumo local automático: {prompt[:1800]}"
                self.summary_repo.add(conversation_id, summary_text)
                history.append({"role": "model", "parts": [{"text": summary_text}]})
            else:
                history.append({"role": "model", "parts": [{"text": latest_summary.summary}]})

        for msg in recent[:-1]:
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [{"text": msg.content}]})
        return history

    def _generate_worker(self, conversation_id: str, user_text: str) -> None:
        try:
            assert self.service is not None
            history = self._build_history(conversation_id)
            generator = self.service.stream_reply(
                model=self.settings.model,
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
                self.ui_queue.put(("status", f"Pronto | tokens conversa: {total}"))
            self.ui_queue.put(("done", ""))
        except (OfflineError, AuthenticationError, RateLimitError, SafetyBlockedError) as exc:
            day = datetime.utcnow().strftime("%Y-%m-%d")
            self.metrics_repo.record(day, 0, 0, is_error=True)
            self.ui_queue.put(("error", str(exc)))
        except Exception as exc:
            self.logger.exception("Erro não tratado")
            self.ui_queue.put(("error", f"Erro inesperado: {exc}"))

    def stop_generation(self) -> None:
        self.stop_flag[0] = True
        self.status_label.config(text="Interrompido")

    def _export(self, ext: str) -> None:
        cid = self.current_conversation_id
        if not cid:
            return
        messages = self.msg_repo.list_by_conversation(cid)
        stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        out = self.paths.exports_dir / f"conversation_{stamp}.{ext}"
        if ext == "md":
            content = "\n\n".join([f"## {m.role}\n\n{m.content}" for m in messages])
        else:
            content = "\n\n".join([f"[{m.role}]\n{m.content}" for m in messages])
        out.write_text(content, encoding="utf-8")
        messagebox.showinfo("Exportado", str(out))

    def export_txt(self) -> None:
        self._export("txt")

    def export_md(self) -> None:
        self._export("md")


def run_app() -> None:
    root = tk.Tk()
    app = MindDriveApp(root)

    def _on_close() -> None:
        app.db.close()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", _on_close)
    root.mainloop()
