from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Conversation:
    id: str
    title: str
    created_at: str
    updated_at: str
    pinned: int
    model: str
    temperature: float
    max_output_tokens: int


@dataclass
class Message:
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str
    token_in: int
    token_out: int
    token_total: int


@dataclass
class Summary:
    id: str
    conversation_id: str
    summary: str
    created_at: str
    token_in: int
    token_out: int
    token_total: int
