from datetime import timedelta

import jwt
import pytest

from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_round_trip() -> None:
    password = "correct horse battery staple"
    hashed_password = get_password_hash(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrong password", hashed_password)


def test_access_token_contains_access_claims() -> None:
    token = create_access_token("user-id", expires_delta=timedelta(minutes=5))

    payload = decode_token(token)

    assert payload["sub"] == "user-id"
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_refresh_token_has_refresh_type() -> None:
    token = create_refresh_token("user-id", expires_delta=timedelta(days=1))

    assert decode_token(token)["type"] == "refresh"


def test_decode_token_rejects_tampering() -> None:
    token = create_access_token("user-id")
    header, payload, _ = token.split(".")
    tampered_token = f"{header}.{payload}.invalid-signature"

    with pytest.raises(jwt.PyJWTError):
        decode_token(tampered_token)
