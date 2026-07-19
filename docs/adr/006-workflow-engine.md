# ADR-006: Node-Based Workflow Engine

## Status
**Accepted** — July 2026

## Context
Users need to automate repetitive productivity sequences (e.g., "when a meeting ends, extract action items, create tasks, and send a summary email"). This requires a flexible, user-configurable automation engine.

## Decision
Implement a **node-based workflow engine** where workflows are directed acyclic graphs (DAGs) of typed nodes.

### Node Types
| Type | Purpose | Example |
|------|---------|---------|
| `trigger` | Initiates workflow execution | `on_new_task`, `on_meeting_end`, `manual` |
| `action` | Performs a side-effect | `create_task`, `send_email`, `update_calendar` |
| `condition` | Branches execution flow | `if priority == high` |
| `ai_transform` | Runs LLM processing | `summarize_text`, `extract_entities` |

### Execution Model
1. Workflow definition stored as a JSON DAG in Firestore
2. Trigger fires → engine resolves execution order via topological sort
3. Each node executes sequentially, passing output to downstream nodes
4. Execution logs captured per-node for auditability

### Frontend
- Visual node canvas with drag-and-drop node placement
- Real-time execution log display during workflow runs

## Consequences
- **Positive**: Highly extensible — new node types can be added without changing the engine; visual builder is intuitive for non-technical users; full audit trail
- **Negative**: Complex error handling for mid-workflow failures; no parallel node execution in V1; DAG validation needed to prevent cycles
