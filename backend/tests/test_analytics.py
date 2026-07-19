import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status
from fastapi.testclient import TestClient

def test_get_insights_empty(client: TestClient):
    response = client.get("/api/v1/analytics/insights")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "focusScore" in data
    assert "burnoutRisk" in data
    assert data["burnoutRisk"] == "low"
    assert "productivityScore" in data
    assert "completionRate" in data
    assert "timeDistribution" in data

def test_get_insights_with_data(client: TestClient):
    # Add tasks
    client.post("/api/v1/tasks", json={
        "title": "Completed Task",
        "description": "Desc",
        "priority": "high",
        "estimatedMinutes": 60,
        "actualMinutes": 45,
        "status": "completed",
        "category": "Work"
    })
    
    # Get insights
    response = client.get("/api/v1/analytics/insights")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "focusScore" in data
    assert "burnoutRisk" in data

def test_get_daily_briefing(client: TestClient):
    # Add task
    client.post("/api/v1/tasks", json={
        "title": "Briefing Task",
        "description": "Desc",
        "priority": "urgent",
        "estimatedMinutes": 30,
        "status": "todo",
        "category": "Work"
    })
    
    # Add calendar event today
    start = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    client.post("/api/v1/calendar", json={
        "title": "Strategy Meeting",
        "start": start,
        "end": end,
        "type": "meeting"
    })

    # Fetch daily briefing
    response = client.get("/api/v1/analytics/briefing")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "greeting" in data
    assert "priorities" in data
    assert "suggestedSchedule" in data
    assert len(data["priorities"]) > 0
