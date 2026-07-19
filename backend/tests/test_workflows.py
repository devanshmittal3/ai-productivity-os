import pytest
from fastapi import status
from fastapi.testclient import TestClient

def test_read_workflows_empty(client: TestClient):
    response = client.get("/api/v1/workflows")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_workflow_success(client: TestClient):
    payload = {
        "title": "Email Action Flow",
        "nodes": [
            {"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}},
            {"id": "n2", "type": "action", "config": {"action": "send_email", "recipient": "test@example.com"}}
        ]
    }
    response = client.post("/api/v1/workflows", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["title"] == "Email Action Flow"
    assert data["isActive"] is True
    assert len(data["nodes"]) == 2

def test_create_workflow_validation_error(client: TestClient):
    # Empty title or missing nodes
    payload = {
        "title": "",
        "nodes": []
    }
    response = client.post("/api/v1/workflows", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_workflow_success(client: TestClient):
    flow = client.post("/api/v1/workflows", json={
        "title": "Original Flow",
        "nodes": [{"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}}]
    }).json()

    update_payload = {
        "title": "Updated Flow Title",
        "nodes": [
            {"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}},
            {"id": "n2", "type": "action", "config": {"action": "summarize"}}
        ]
    }
    response = client.put(f"/api/v1/workflows/{flow['id']}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Flow Title"
    assert len(data["nodes"]) == 2

def test_delete_workflow_success(client: TestClient):
    flow = client.post("/api/v1/workflows", json={
        "title": "Delete Flow",
        "nodes": [{"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}}]
    }).json()

    response = client.delete(f"/api/v1/workflows/{flow['id']}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["success"] is True

def test_toggle_workflow_success(client: TestClient):
    flow = client.post("/api/v1/workflows", json={
        "title": "Toggle Flow",
        "nodes": [{"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}}]
    }).json()

    # Toggle to False
    res1 = client.put(f"/api/v1/workflows/{flow['id']}/toggle")
    assert res1.status_code == status.HTTP_200_OK
    assert res1.json()["isActive"] is False

    # Toggle to True
    res2 = client.put(f"/api/v1/workflows/{flow['id']}/toggle")
    assert res2.json()["isActive"] is True

def test_toggle_workflow_not_found(client: TestClient):
    response = client.put("/api/v1/workflows/nonexistent-id/toggle")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_execute_workflow_success(client: TestClient):
    flow = client.post("/api/v1/workflows", json={
        "title": "Execution Flow",
        "nodes": [
            {"id": "n1", "type": "trigger", "config": {"event": "on_new_task"}},
            {"id": "n2", "type": "action", "config": {"action": "send_email", "recipient": "exec@example.com"}}
        ]
    }).json()

    # Execute via /execute
    response = client.post(f"/api/v1/workflows/{flow['id']}/execute", json={"event": "test"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert len(data["actions_run"]) > 0

    # Execute via /run
    response_run = client.post(f"/api/v1/workflows/{flow['id']}/run")
    assert response_run.status_code == status.HTTP_200_OK
    assert response_run.json()["success"] is True

def test_execute_workflow_not_found(client: TestClient):
    response = client.post("/api/v1/workflows/nonexistent-id/execute", json={})
    assert response.status_code == status.HTTP_404_NOT_FOUND
