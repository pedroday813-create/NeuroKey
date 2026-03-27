from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import uuid4

from minddriveai.config.settings import AppSettings
from minddriveai.storage.db import Database
from minddriveai.storage.models import Conversation, Message, Summary


def utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


class ConversationRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def create(self, title: str, settings: AppSettings) -> Conversation:
        convo = Conversation(
            id=str(uuid4()),
            title=title,
            created_at=utc_now_iso(),
            updated_at=utc_now_iso(),
            pinned=0,
            model=settings.model,
            temperature=settings.temperature,
            max_output_tokens=settings.max_output_tokens,
        )
        self.db.conn.execute(
            """
            INSERT INTO conversations(
                id,title,created_at,updated_at,pinned,model,temperature,max_output_tokens
            ) VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                convo.id,
                convo.title,
                convo.created_at,
                convo.updated_at,
                convo.pinned,
                convo.model,
                convo.temperature,
                convo.max_output_tokens,
            ),
        )
        self.db.conn.commit()
        return convo

    def list_all(self) -> list[Conversation]:
        rows = self.db.conn.execute(
            "SELECT * FROM conversations ORDER BY pinned DESC, updated_at DESC"
        ).fetchall()
        return [Conversation(**dict(row)) for row in rows]

    def rename(self, conversation_id: str, title: str) -> None:
        self.db.conn.execute(
            "UPDATE conversations SET title=?, updated_at=? WHERE id=?",
            (title, utc_now_iso(), conversation_id),
        )
        self.db.conn.commit()

    def delete(self, conversation_id: str) -> None:
        self.db.conn.execute("DELETE FROM conversations WHERE id=?", (conversation_id,))
        self.db.conn.commit()


class MessageRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(
        self,
        conversation_id: str,
        role: str,
        content: str,
        token_in: int = 0,
        token_out: int = 0,
        token_total: int = 0,
    ) -> Message:
        message = Message(
            id=str(uuid4()),
            conversation_id=conversation_id,
            role=role,
            content=content,
            created_at=utc_now_iso(),
            token_in=token_in,
            token_out=token_out,
            token_total=token_total,
        )
        self.db.conn.execute(
            """
            INSERT INTO messages(
                id,conversation_id,role,content,created_at,token_in,token_out,token_total
            ) VALUES (?,?,?,?,?,?,?,?)
            """,
            (
                message.id,
                message.conversation_id,
                message.role,
                message.content,
                message.created_at,
                message.token_in,
                message.token_out,
                message.token_total,
            ),
        )
        self.db.conn.execute(
            "UPDATE conversations SET updated_at=? WHERE id=?", (utc_now_iso(), conversation_id)
        )
        self.db.conn.commit()
        return message

    def list_by_conversation(self, conversation_id: str) -> list[Message]:
        rows = self.db.conn.execute(
            "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC",
            (conversation_id,),
        ).fetchall()
        return [Message(**dict(row)) for row in rows]

    def total_tokens(self, conversation_id: str) -> int:
        row = self.db.conn.execute(
            "SELECT COALESCE(SUM(token_total),0) AS total FROM messages WHERE conversation_id=?",
            (conversation_id,),
        ).fetchone()
        return int(row["total"])


class SummaryRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def add(
        self,
        conversation_id: str,
        summary: str,
        token_in: int = 0,
        token_out: int = 0,
    ) -> Summary:
        item = Summary(
            id=str(uuid4()),
            conversation_id=conversation_id,
            summary=summary,
            created_at=utc_now_iso(),
            token_in=token_in,
            token_out=token_out,
            token_total=token_in + token_out,
        )
        self.db.conn.execute(
            """
            INSERT INTO summaries(
                id,conversation_id,summary,created_at,token_in,token_out,token_total
            ) VALUES (?,?,?,?,?,?,?)
            """,
            (
                item.id,
                item.conversation_id,
                item.summary,
                item.created_at,
                item.token_in,
                item.token_out,
                item.token_total,
            ),
        )
        self.db.conn.commit()
        return item

    def latest_for_conversation(self, conversation_id: str) -> Summary | None:
        row = self.db.conn.execute(
            "SELECT * FROM summaries WHERE conversation_id=? ORDER BY created_at DESC LIMIT 1",
            (conversation_id,),
        ).fetchone()
        return Summary(**dict(row)) if row else None


class SettingsRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def get_settings(self) -> AppSettings:
        rows = self.db.conn.execute("SELECT key,value FROM settings").fetchall()
        if not rows:
            return AppSettings()
        data = {row["key"]: json.loads(row["value"]) for row in rows}
        return AppSettings(**data)

    def save_settings(self, settings: AppSettings) -> None:
        data = {
            "model": settings.model,
            "temperature": settings.temperature,
            "max_output_tokens": settings.max_output_tokens,
            "context_window_messages": settings.context_window_messages,
            "telemetry_opt_in": settings.telemetry_opt_in,
        }
        for key, value in data.items():
            self.db.conn.execute(
                (
                    "INSERT INTO settings(key,value) VALUES(?,?) "
                    "ON CONFLICT(key) DO UPDATE SET value=excluded.value"
                ),
                (key, json.dumps(value)),
            )
        self.db.conn.commit()


class MetricsRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def record(self, day: str, token_in: int, token_out: int, is_error: bool) -> None:
        self.db.conn.execute(
            """
            INSERT INTO metrics_daily(day, token_in, token_out, total_calls, total_errors)
            VALUES (?, ?, ?, 1, ?)
            ON CONFLICT(day) DO UPDATE SET
                token_in=metrics_daily.token_in + excluded.token_in,
                token_out=metrics_daily.token_out + excluded.token_out,
                total_calls=metrics_daily.total_calls + 1,
                total_errors=metrics_daily.total_errors + excluded.total_errors
            """,
            (day, token_in, token_out, 1 if is_error else 0),
        )
        self.db.conn.commit()
