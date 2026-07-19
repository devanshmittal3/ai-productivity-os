import pytest
from datetime import datetime, timezone, timedelta
from app.services.analytics_service import AnalyticsService
from app.services.scheduler import SchedulerService
from app.services.document_service import DocumentService
from app.services.workflow_runner import WorkflowRunner

def test_analytics_service_burnout_risks():
    # Test high burnout risk (> 2 high priority tasks)
    tasks_high = [
        {"status": "todo", "priority": "high", "actualMinutes": 10},
        {"status": "todo", "priority": "urgent", "actualMinutes": 20},
        {"status": "todo", "priority": "high", "actualMinutes": 30}
    ]
    res_high = AnalyticsService.calculate_focus_insights(tasks_high, [])
    assert res_high["burnoutRisk"] == "high"
    assert any("elevated" in ins for ins in res_high["insights"])

    # Test critical burnout risk (> 4 high priority tasks)
    tasks_crit = [
        {"status": "todo", "priority": "high"},
        {"status": "todo", "priority": "urgent"},
        {"status": "todo", "priority": "high"},
        {"status": "todo", "priority": "high"},
        {"status": "todo", "priority": "urgent"}
    ]
    res_crit = AnalyticsService.calculate_focus_insights(tasks_crit, [])
    assert res_crit["burnoutRisk"] == "critical"

    # Test completion rate tip (< 0.5 completion rate and > 3 total tasks)
    tasks_low_comp = [
        {"status": "completed", "priority": "low"},
        {"status": "todo", "priority": "low"},
        {"status": "todo", "priority": "low"},
        {"status": "todo", "priority": "low"}
    ]
    res_low = AnalyticsService.calculate_focus_insights(tasks_low_comp, [])
    assert any("Breakdown" in ins for ins in res_low["insights"])

def test_scheduler_service_edge_cases():
    # 1. Skip completed tasks
    tasks = [
        {"id": "t1", "title": "Completed", "status": "completed"},
        {"id": "t2", "title": "Todo", "status": "todo", "estimatedMinutes": 45}
    ]
    res = SchedulerService.auto_schedule_tasks(tasks, [])
    assert len(res) == 1
    assert res[0]["relatedTaskId"] == "t2"

    # 2. Exceed working hours -> move to next day
    # Task with large duration that pushes past the end hour (17:00)
    tasks_large = [
        {"id": "t1", "title": "Task 1", "status": "todo", "estimatedMinutes": 600}
    ]
    res_large = SchedulerService.auto_schedule_tasks(tasks_large, [], start_hours="09:00", end_hours="17:00")
    assert len(res_large) == 1
    # Should schedule on the next day's start hour (09:00) because it fits within working hours of the next day or shifts
    assert res_large[0]["start"].hour == 9

def test_document_service_formats_and_rag():
    # PDF
    pdf_text = DocumentService.extract_text_from_file("doc.pdf", b"abc")
    assert "PDF" in pdf_text
    
    # Word docx
    docx_text = DocumentService.extract_text_from_file("doc.docx", b"abc")
    assert "Word" in docx_text

    # Unsupported format
    other_text = DocumentService.extract_text_from_file("doc.xlsx", b"abc")
    assert "Unsupported" in other_text

    # Empty chunk list logic in cosine similarity
    docs = [{"fileName": "empty.txt", "extractedText": "   "}]
    res = DocumentService.search_rag_chunks("test", docs)
    assert res["answer"] == "No relevant text matching the query was found in the uploaded documents."

@pytest.mark.asyncio
async def test_workflow_runner_actions():
    # Test legacy actions list fallback and execution of all action types
    wf = {
        "id": "wf-1",
        "title": "Legacy Workflow",
        "actions": [
            {"type": "summarize", "config": {}},
            {"type": "create_tasks", "config": {}},
            {"type": "schedule_reminders", "config": {}},
            {"type": "unknown_action", "config": {}}
        ]
    }
    
    res = await WorkflowRunner.execute_workflow(wf, {})
    assert res["success"] is True
    assert len(res["actions_run"]) == 4
    assert res["actions_run"][0]["action"] == "summarize"
    assert res["actions_run"][1]["action"] == "create_tasks"
    assert res["actions_run"][2]["action"] == "schedule_reminders"
    assert res["actions_run"][3]["action"] == "unknown_action"
