import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status
from fastapi.testclient import TestClient

def test_read_events_empty(client: TestClient):
    start = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    response = client.get(f"/api/v1/calendar?start={start}&end={end}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_event_success(client: TestClient):
    start = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    
    payload = {
        "title": "Strategy Sync",
        "description": "Discuss project launch goals",
        "start": start,
        "end": end,
        "type": "meeting"
    }
    response = client.post("/api/v1/calendar", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["title"] == "Strategy Sync"
    assert data["type"] == "meeting"

def test_create_event_validation_error(client: TestClient):
    # Invalid type
    payload = {
        "title": "Strategy Sync",
        "start": datetime.now(timezone.utc).isoformat(),
        "end": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "type": "invalid_type"
    }
    response = client.post("/api/v1/calendar", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_auto_schedule(client: TestClient):
    # Create a task first
    task_resp = client.post("/api/v1/tasks", json={
        "title": "Task 1",
        "description": "Desc 1",
        "priority": "high",
        "estimatedMinutes": 45,
        "tags": [],
        "category": "Work"
    })
    assert task_resp.status_code == 201
    
    # Trigger auto schedule
    response = client.post("/api/v1/calendar/auto-schedule", json={"optimize_for_burnout": True})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["events_scheduled"] == 1
    assert len(data["schedule"]) == 1
    assert data["schedule"][0]["type"] == "task_execution"
    assert "Work on: Task 1" in data["schedule"][0]["title"]

def test_rebalance(client: TestClient):
    # Create task
    client.post("/api/v1/tasks", json={
        "title": "Rebalance Task",
        "description": "Desc",
        "priority": "medium",
        "estimatedMinutes": 30,
        "tags": [],
        "category": "Work"
    })
    
    # Create an event representing an existing task_execution today
    target_date = datetime.now(timezone.utc)
    client.post("/api/v1/calendar", json={
        "title": "Work on: Rebalance Task",
        "start": target_date.isoformat(),
        "end": (target_date + timedelta(minutes=30)).isoformat(),
        "type": "task_execution"
    })
    
    # Trigger rebalance
    response = client.post("/api/v1/calendar/rebalance", json={"target_date": target_date.isoformat()})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["conflicts_resolved"] == 1
    assert len(data["schedule"]) > 0
