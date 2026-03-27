from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any, cast

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from minddriveai.security.passwords import (
    derive_key,
    hash_password,
    record_from_dict,
    record_to_dict,
    verify_password,
)


class SecretStore:
    def __init__(self, path: Path) -> None:
        self.path = path

    def exists(self) -> bool:
        return self.path.exists()

    def save_api_key(self, api_key: str, local_password: str) -> None:
        salt = os.urandom(16)
        nonce = os.urandom(12)
        key = derive_key(local_password, salt)
        ciphertext = AESGCM(key).encrypt(nonce, api_key.encode("utf-8"), None)
        payload = {
            "password": record_to_dict(hash_password(local_password)),
            "kdf": {
                "algorithm": "scrypt",
                "n": 16384,
                "r": 8,
                "p": 1,
                "dklen": 32,
                "salt_b64": base64.b64encode(salt).decode("utf-8"),
            },
            "secret": {
                "cipher": "AES-GCM",
                "nonce_b64": base64.b64encode(nonce).decode("utf-8"),
                "ciphertext_b64": base64.b64encode(ciphertext).decode("utf-8"),
            },
        }
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def load_api_key(self, local_password: str) -> str:
        data = self._read()
        record = record_from_dict(cast(dict[str, Any], data["password"]))
        if not verify_password(local_password, record):
            raise ValueError("Senha local inválida.")
        kdf = cast(dict[str, Any], data["kdf"])
        secret = cast(dict[str, Any], data["secret"])
        salt = base64.b64decode(str(kdf["salt_b64"]))
        nonce = base64.b64decode(str(secret["nonce_b64"]))
        ciphertext = base64.b64decode(str(secret["ciphertext_b64"]))
        key = derive_key(local_password, salt)
        try:
            raw = AESGCM(key).decrypt(nonce, ciphertext, None)
        except InvalidTag as exc:
            raise ValueError("Falha de integridade ao descriptografar chave.") from exc
        return cast(bytes, raw).decode("utf-8")

    def _read(self) -> dict[str, Any]:
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        return cast(dict[str, Any], raw)
