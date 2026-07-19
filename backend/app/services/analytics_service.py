from typing import List, Dict, Any
from datetime import datetime

class AnalyticsService:
    @staticmethod
    def calculate_focus_insights(tasks: List[Dict[str, Any]], events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates:
        - Focus Score (0-100) based on task completion and scheduled deep work.
        - Burnout Risk (low, medium, high, critical) based on active tasks with tight deadlines.
        - Completion Rate of current tasks.
        """
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get("status") == "completed")
        
        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 1.0
        
        # Calculate Focus Score
        # Formula: completion rate * 60 + focus sessions scheduled * 40 (max 100)
        focus_sessions_count = sum(1 for e in events if e.get("type") == "focus_session")
        focus_score = int(completion_rate * 60 + min(focus_sessions_count * 10, 40))
        
        # Burnout risk estimation:
        # High burnout risk if there are multiple high-priority tasks with upcoming deadlines
        high_priority_active_count = sum(
            1 for t in tasks 
            if t.get("status") != "completed" and t.get("priority") in ("high", "urgent")
        )
        
        burnout_risk = "low"
        if high_priority_active_count > 4:
            burnout_risk = "critical"
        elif high_priority_active_count > 2:
            burnout_risk = "high"
        elif high_priority_active_count > 0:
            burnout_risk = "medium"
            
        # Calculate time distribution
        work_mins = sum(t.get("actualMinutes", 0) for t in tasks)
        focus_mins = focus_sessions_count * 25 # default 25 mins per session
        meeting_mins = sum(
            int((datetime.fromisoformat(e["end"].replace("Z", "+00:00")) - datetime.fromisoformat(e["start"].replace("Z", "+00:00"))).total_seconds() / 60)
            for e in events if e.get("type") == "meeting" and isinstance(e.get("start"), str)
        )
        
        time_distribution = {
            "workMinutes": work_mins,
            "personalMinutes": 60, # Baseline placeholder
            "meetingMinutes": meeting_mins if meeting_mins > 0 else 30,
            "focusMinutes": focus_mins
        }

        # Dynamic recommendations
        insights = []
        if burnout_risk in ("high", "critical"):
            insights.append("Warning: Burnout risk is elevated. Consider shifting high-priority deadlines or planning longer breaks.")
        if focus_sessions_count < 2:
            insights.append("Recommendation: Schedule at least one 25-minute deep-work Focus Session tomorrow.")
        if completion_rate < 0.5 and total_tasks > 3:
            insights.append("Tip: Breakdown complex tasks into smaller subtasks to regain momentum.")

        return {
            "focusScore": focus_score,
            "burnoutRisk": burnout_risk,
            "productivityScore": int(completion_rate * 100),
            "completionRate": completion_rate,
            "timeDistribution": time_distribution,
            "insights": insights
        }
