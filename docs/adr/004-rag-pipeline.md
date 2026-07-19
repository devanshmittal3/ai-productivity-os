# ADR-004: RAG Pipeline for Document Intelligence

## Status
**Accepted** — July 2026

## Context
The Study Desk (Documents) module needs to answer natural-language questions about uploaded documents. A naive approach of sending full documents to the LLM would exceed context windows and increase costs. Retrieval-Augmented Generation (RAG) provides targeted, context-aware answers.

## Decision
Implement a **RAG pipeline** using chunked document storage and semantic similarity search.

### Pipeline Architecture
1. **Ingest**: Document uploaded → text extracted → split into overlapping chunks (~512 tokens, 64-token overlap)
2. **Embed**: Each chunk embedded via Gemini Embedding API → stored alongside document metadata
3. **Query**: User question embedded → top-K similar chunks retrieved via cosine similarity
4. **Generate**: Retrieved chunks + question sent to Gemini as grounded context → answer generated with source citations

### Storage
- Document chunks and embeddings stored in Firestore subcollections under each document
- Metadata (title, upload date, chunk count) stored in parent document

## Consequences
- **Positive**: Accurate, grounded answers with source attribution; works within token limits; cost-efficient per query
- **Negative**: Embedding step adds latency to document upload; chunk boundary issues can split relevant context; requires re-embedding if model changes
