from __future__ import annotations

import base64
import hashlib
import os
from dataclasses import dataclass
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


@dataclass
class PasswordRecord:
    algorithm: str
    hash_value: str
    salt_b64: str


def hash_password(password: str) -> PasswordRecord:
    try:
        ph = PasswordHasher()
        hashed = ph.hash(password)
        return PasswordRecord(algorithm="argon2id", hash_value=hashed, salt_b64="")
    except Exception:
        salt = os.urandom(16)
        digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1).hex()
        return PasswordRecord(
            algorithm="scrypt",
            hash_value=digest,
            salt_b64=base64.b64encode(salt).decode("utf-8"),
        )


def verify_password(password: str, record: PasswordRecord) -> bool:
    if record.algorithm == "argon2id":
        ph = PasswordHasher()
        try:
            return bool(ph.verify(record.hash_value, password))
        except VerifyMismatchError:
            return False
    if record.algorithm == "scrypt":
        salt = base64.b64decode(record.salt_b64)
        digest = hashlib.scrypt(
            password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1
        ).hex()
        return digest == record.hash_value
    return False


def derive_key(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)


def record_to_dict(record: PasswordRecord) -> dict[str, Any]:
    return {
        "algorithm": record.algorithm,
        "hash_value": record.hash_value,
        "salt_b64": record.salt_b64,
    }


def record_from_dict(data: dict[str, Any]) -> PasswordRecord:
    return PasswordRecord(
        algorithm=str(data["algorithm"]),
        hash_value=str(data["hash_value"]),
        salt_b64=str(data.get("salt_b64", "")),
    )
