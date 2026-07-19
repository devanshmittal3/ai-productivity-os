from typing import List, Dict, Any
from datetime import datetime, timedelta

class SchedulerService:
    @staticmethod
    def auto_schedule_tasks(tasks: List[Dict[str, Any]], existing_events: List[Dict[str, Any]], start_hours: str = "09:00", end_hours: str = "17:00") -> List[Dict[str, Any]]:
        """
        Simple greedy scheduling algorithm:
        Finds free slots starting from tomorrow within working hours and assigns tasks.
        """
        scheduled_slots = []
        current_time = datetime.now() + timedelta(days=1)
        
        # Start of day helper
        start_h, start_m = map(int, start_hours.split(":"))
        end_h, end_m = map(int, end_hours.split(":"))
        
        current_time = current_time.replace(hour=start_h, minute=start_m, second=0, microsecond=0)

        for task in tasks:
            if task.get("status") == "completed":
                continue
            
            duration_mins = task.get("estimatedMinutes", 30)
            
            # Simple slot calculation: place tasks sequentially
            start_slot = current_time
            end_slot = current_time + timedelta(minutes=duration_mins)
            
            # If slot exceeds working hours, move to next day
            if end_slot.hour > end_h or (end_slot.hour == end_h and end_slot.minute > end_m):
                current_time = current_time + timedelta(days=1)
                current_time = current_time.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
                start_slot = current_time
                end_slot = current_time + timedelta(minutes=duration_mins)

            slot = {
                "id": f"evt-{task['id']}",
                "userId": task.get("userId"),
                "title": f"Work on: {task['title']}",
                "description": f"Auto-scheduled execution block for task {task['id']}",
                "start": start_slot,
                "end": end_slot,
                "type": "task_execution",
                "relatedTaskId": task["id"],
                "createdAt": datetime.now()
            }
            scheduled_slots.append(slot)
            
            # Increment time
            current_time = end_slot + timedelta(minutes=15)  # 15 mins buffer
            
        return scheduled_slots
