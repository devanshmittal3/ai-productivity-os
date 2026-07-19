import pytest
from fastapi import status
from fastapi.testclient import TestClient

def test_read_tasks_empty(client: TestClient):
    response = client.get("/api/v1/tasks")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_task_success(client: TestClient):
    payload = {
        "title": "Solve coding challenge",
        "description": "Implement recursive descent parser",
        "priority": "high",
        "estimatedMinutes": 60,
        "tags": ["compiler", "rust"],
        "category": "Work",
        "dependencies": []
    }
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["title"] == "Solve coding challenge"
    assert data["status"] == "todo"
    assert data["userId"] == "test_user_id"

def test_create_task_validation_error(client: TestClient):
    # Empty title
    payload = {
        "title": "",
        "priority": "high",
        "estimatedMinutes": 60,
        "tags": [],
        "category": "Work",
        "dependencies": []
    }
    response = client.post("/api/v1/tasks", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_read_tasks_filtering(client: TestClient):
    # Create two tasks with different priorities
    client.post("/api/v1/tasks", json={
        "title": "Task 1",
        "description": "Desc 1",
        "priority": "low",
        "estimatedMinutes": 10,
        "tags": [],
        "category": "Personal"
    })
    client.post("/api/v1/tasks", json={
        "title": "Task 2",
        "description": "Desc 2",
        "priority": "urgent",
        "estimatedMinutes": 20,
        "tags": [],
        "category": "Work"
    })

    # Read low priority
    res_low = client.get("/api/v1/tasks?priority=low")
    assert res_low.status_code == 200
    assert len(res_low.json()) == 1
    assert res_low.json()[0]["title"] == "Task 1"

    # Read urgent priority
    res_urg = client.get("/api/v1/tasks?priority=urgent")
    assert res_urg.status_code == 200
    assert len(res_urg.json()) == 1
    assert res_urg.json()[0]["title"] == "Task 2"

    # Read non-existent priority
    res_high = client.get("/api/v1/tasks?priority=high")
    assert res_high.status_code == 200
    assert len(res_high.json()) == 0

def test_update_task_success(client: TestClient):
    # Create task
    task = client.post("/api/v1/tasks", json={
        "title": "Original Task",
        "description": "Original Desc",
        "priority": "medium",
        "estimatedMinutes": 30,
        "tags": [],
        "category": "Work"
    }).json()

    # Update status to completed
    update_payload = {"status": "completed", "priority": "high"}
    response = client.put(f"/api/v1/tasks/{task['id']}", json=update_payload)
    assert response.status_code == status.HTTP_200_OK
    updated_data = response.json()
    assert updated_data["status"] == "completed"
    assert updated_data["priority"] == "high"

def test_update_task_not_found(client: TestClient):
    response = client.put("/api/v1/tasks/nonexistent-id", json={"status": "completed"})
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_task_success(client: TestClient):
    task = client.post("/api/v1/tasks", json={
        "title": "Task to Delete",
        "description": "Desc",
        "priority": "low",
        "estimatedMinutes": 10,
        "tags": [],
        "category": "Work"
    }).json()

    # Delete
    response = client.delete(f"/api/v1/tasks/{task['id']}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["success"] is True

    # Read should be empty
    read_resp = client.get("/api/v1/tasks")
    assert len(read_resp.json()) == 0

def test_delete_task_not_found(client: TestClient):
    response = client.delete("/api/v1/tasks/nonexistent-id")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_parse_nlp_task(client: TestClient):
    response = client.post("/api/v1/tasks/parse-nlp", json={"prompt": "Do DBMS normalization homework"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "tasks" in data
    assert "reasoning" in data
    assert len(data["tasks"]) > 0
    assert data["tasks"][0]["title"] == "Finish DBMS Assignment"
