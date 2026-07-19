# ADR-001: Repository Pattern for Data Access

## Status
**Accepted** — July 2026

## Context
The backend needs a consistent abstraction layer between FastAPI route handlers and the Firestore database. Without this, each endpoint would contain duplicated query logic, making the codebase fragile and difficult to test.

## Decision
Adopt the **Repository Pattern** where each domain entity (Tasks, Meetings, Documents, Workflows, Calendar Events) has a dedicated repository module that encapsulates all Firestore CRUD operations. Service modules depend on repositories, never on the Firestore client directly.

### Key Design Choices
- Repositories expose async methods: `get()`, `list()`, `create()`, `update()`, `delete()`
- All Firestore document ↔ Pydantic model serialization happens inside the repository
- Services compose repositories and apply business logic
- Route handlers are thin — they validate input, call services, and return responses

## Consequences
- **Positive**: Clean separation of concerns; easy to mock repositories for testing; Firestore can be swapped for another backend without touching services
- **Negative**: Slight indirection overhead; developers must maintain both repository and service layers
