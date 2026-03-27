from pathlib import Path

from minddriveai.security.secrets_store import SecretStore


def test_secret_roundtrip(tmp_path: Path) -> None:
    store = SecretStore(tmp_path / "secret.json")
    store.save_api_key("AIzaFakeKey", "senhaforte")
    assert store.load_api_key("senhaforte") == "AIzaFakeKey"
