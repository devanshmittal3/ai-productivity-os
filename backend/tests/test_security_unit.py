import pytest
from datetime import timedelta
import jwt
from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    decode_access_token
)
from app.core.config import settings

def test_create_access_token_default_expiry():
    token = create_access_token(subject="user_123")
    assert token is not None
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    assert payload["sub"] == "user_123"

def test_verify_password_exception():
    # Trigger exception in verify_password by passing invalid type
    res = verify_password(None, "some_hash")
    assert res is False

def test_decode_access_token_invalid():
    # Decode invalid token string
    res = decode_access_token("invalid.jwt.token")
    assert res is None

def test_decode_access_token_expired():
    # Create expired token
    token = create_access_token(subject="user_expired", expires_delta=timedelta(seconds=-10))
    res = decode_access_token(token)
    assert res is None
