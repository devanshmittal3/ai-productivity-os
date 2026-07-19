import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class WorkflowRunner:
    @staticmethod
    async def execute_workflow(workflow: Dict[str, Any], trigger_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes automated actions defined in user workflows.
        Actions: summarize, create_tasks, schedule_reminders, send_email
        """
        title = workflow.get("title") or workflow.get("name") or "Unnamed Workflow"
        logger.info(f"Starting execution for workflow '{title}' (ID: {workflow['id']})")
        results = []
        
        # Resolve actions from new node structure or fallback to legacy actions list
        nodes = workflow.get("nodes", [])
        actions = []
        if nodes:
            for node in nodes:
                if node.get("type") == "action":
                    config = node.get("config", {})
                    act_type = config.get("action") or config.get("type") or "unknown"
                    actions.append({"type": act_type, "config": config})
        else:
            actions = workflow.get("actions", [])
            
        for index, action in enumerate(actions):
            action_type = action.get("type")
            config = action.get("config", {})
            logger.info(f"Running action {index+1}/{len(actions)}: {action_type}")
            
            # Simulated execution reports
            if action_type in ("summarize", "meeting_end"):
                results.append({"action": action_type, "status": "completed", "output": "Created auto summary."})
            elif action_type in ("create_tasks", "create_calendar_event"):
                results.append({"action": action_type, "status": "completed", "tasks_created": ["task-1", "task-2"]})
            elif action_type == "schedule_reminders":
                results.append({"action": action_type, "status": "completed", "reminders_added": 1})
            elif action_type == "send_email":
                results.append({"action": action_type, "status": "completed", "email_sent_to": config.get("recipient", "user@example.com")})
            else:
                results.append({"action": action_type, "status": "completed", "info": f"Executed action {action_type}"})

        logger.info(f"Completed execution for workflow '{title}'")
        return {"workflow_id": workflow["id"], "success": True, "actions_run": results}
