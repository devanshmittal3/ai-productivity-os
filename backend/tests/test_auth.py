import pytest
from fastapi import status
from fastapi.testclient import TestClient

def test_register_user_success(client: TestClient):
    payload = {
        "email": "newuser@example.com",
        "password": "strongpassword",
        "name": "New User",
        "role": "developer"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user_id" in data

def test_register_user_duplicate_email(client: TestClient):
    # Register first
    payload = {
        "email": "duplicate@example.com",
        "password": "password123",
        "name": "Original User",
        "role": "professional"
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == status.HTTP_201_CREATED

    # Register again with same email
    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in resp2.json()["detail"]

def test_login_user_success(client: TestClient):
    # Register first
    payload = {
        "email": "login_me@example.com",
        "password": "correct_password",
        "name": "Login User",
        "role": "professional"
    }
    client.post("/api/v1/auth/register", json=payload)

    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "login_me@example.com", "password": "correct_password"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_invalid_credentials(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user_me(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["role"] == "professional"

def test_update_user_settings_success(client: TestClient):
    settings_payload = {
        "theme": "light",
        "workHoursStart": "10:00",
        "workHoursEnd": "18:00",
        "focusSessionDuration": 40,
        "burnoutThresholdHours": 45
    }
    response = client.put("/api/v1/auth/me/settings", json=settings_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["settings"]["theme"] == "light"
    assert data["settings"]["workHoursStart"] == "10:00"
    assert data["settings"]["focusSessionDuration"] == 40
    assert data["settings"]["burnoutThresholdHours"] == 45

def test_update_user_settings_validation_errors(client: TestClient):
    # Invalid theme and duration ge/le limits
    settings_payload = {
        "theme": "purple",
        "workHoursStart": "10:00",
        "workHoursEnd": "18:00",
        "focusSessionDuration": 200, # Max is 120
        "burnoutThresholdHours": 45
    }
    response = client.put("/api/v1/auth/me/settings", json=settings_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
