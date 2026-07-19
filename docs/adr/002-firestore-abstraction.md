# ADR-002: Firestore as Primary Datastore

## Status
**Accepted** — July 2026

## Context
We evaluated SQL databases (Cloud SQL/PostgreSQL), MongoDB Atlas, and Firestore for the AI Productivity OS backend. The app manages semi-structured documents (tasks with nested subtasks, meeting transcripts, workflow DAGs) that benefit from flexible schemas.

## Decision
Use **Google Cloud Firestore** (Native mode) as the primary datastore for all domain entities.

### Rationale
- **Serverless scaling**: No capacity planning; scales to zero when idle
- **Real-time listeners**: Enables future live-sync features (collaborative editing, live dashboard)
- **Flexible schema**: Tasks, workflows, and meeting notes have variable structures that map naturally to documents
- **Firebase Auth integration**: Seamless pairing with Firebase Authentication for user-scoped security rules

## Consequences
- **Positive**: Zero infrastructure management; sub-millisecond reads for hot data; native integration with GCP ecosystem
- **Negative**: No JOIN operations — denormalization required for cross-entity queries; vendor lock-in to Google Cloud; eventual consistency in multi-region setups
