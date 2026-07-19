import pytest
import json
from fastapi import status
from fastapi.testclient import TestClient

def test_chat_stream_success(client: TestClient):
    response = client.post(
        "/api/v1/copilot/chat/stream",
        json={"message": "Draft a follow up email regarding milestones"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "text/event-stream" in response.headers["content-type"]
    
    # Read the streamed events
    chunks = []
    for line in response.iter_lines():
        if line:
            decoded = line if isinstance(line, str) else line.decode("utf-8")
            if decoded.startswith("data: "):
                data_str = decoded[6:]
                if data_str == "[DONE]":
                    break
                data = json.loads(data_str)
                chunks.append(data["text"])
                
    full_text = "".join(chunks)
    assert "Subject:" in full_text or "milestones" in full_text.lower() or "copilot" in full_text.lower()

def test_get_recommendations(client: TestClient):
    # Setup some tasks to trigger the heuristics
    for i in range(3):
        client.post("/api/v1/tasks", json={
            "title": f"Coding task {i}",
            "description": "desc",
            "priority": "medium",
            "estimatedMinutes": 30,
            "category": "Work"
        })
        
    response = client.get("/api/v1/copilot/recommendations")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    assert data["recommendations"][0]["actionType"] == "schedule_block"

def test_draft_email(client: TestClient):
    payload = {
        "prompt": "Ask for feedback on the database design document",
        "category": "professional",
        "tone": "casual"
    }
    response = client.post("/api/v1/copilot/email/draft", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "subject" in data
    assert "body" in data
