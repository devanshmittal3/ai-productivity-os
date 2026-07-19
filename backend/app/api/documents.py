from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Any, List, Dict
from datetime import datetime, timezone

from app.api.deps import (
    get_current_user,
    get_document_repository,
    DocumentRepositoryInterface
)
from app.models.document import (
    DocUploadResponseSchema,
    DocInsightsResponseSchema,
    DocSearchSchema,
    DocSearchResponseSchema,
    DocAnalysisSchema
)
from app.services.document_service import DocumentService
from app.services.ai_service import AIService

router = APIRouter()

@router.get("", response_model=List[DocInsightsResponseSchema])
async def read_documents(
    current_user: Dict = Depends(get_current_user),
    doc_repo: DocumentRepositoryInterface = Depends(get_document_repository)
) -> Any:
    docs = await doc_repo.get_by_user(current_user["id"])
    # Map stored entity to schema response
    results = []
    for doc in docs:
        results.append({
            "doc_id": doc["id"],
            "summary": doc.get("aiAnalysis", {}).get("summary", ""),
            "keyPoints": doc.get("aiAnalysis", {}).get("keyPoints", []),
            "flashcards": doc.get("aiAnalysis", {}).get("flashcards", []),
            "quiz": doc.get("aiAnalysis", {}).get("quiz", []),
            "importantDates": doc.get("aiAnalysis", {}).get("importantDates", [])
        })
    return results

@router.post("/upload", response_model=DocUploadResponseSchema)
async def upload_document(
    file: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user),
    doc_repo: DocumentRepositoryInterface = Depends(get_document_repository)
) -> Any:
    # Validate extension
    extension = file.filename.split(".")[-1].lower()
    if extension not in ("pdf", "docx", "txt"):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported.")
        
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")
        
    # Extract plain text
    extracted_text = DocumentService.extract_text_from_file(file.filename, file_bytes)
    
    # Run Gemini analysis to extract summary, flashcards, quizzes, dates
    system_instr = (
        "You are a study/professional research analyst. Review the extracted text and output a "
        "JSON block detailing the document's summary, keyPoints, a set of study flashcards, "
        "a multiple-choice quiz (quiz list of questions, each with options and the correct answer index), "
        "and any importantDates mentioned (date as ISO timestamp)."
    )
    ai_analysis = AIService.generate_json(
        prompt=extracted_text,
        response_schema=DocAnalysisSchema,
        system_instruction=system_instr
    )
    
    # Save document record
    doc_dict = {
        "userId": current_user["id"],
        "fileName": file.filename,
        "fileSize": file_size,
        "fileType": extension,
        "extractedText": extracted_text,
        "aiAnalysis": ai_analysis
    }
    
    created = await doc_repo.create(doc_dict)
    
    return {
        "doc_id": created["id"],
        "filename": created["fileName"],
        "file_type": created["fileType"],
        "size": created["fileSize"]
    }

@router.get("/{id}/insights", response_model=DocInsightsResponseSchema)
async def get_document_insights(
    id: str,
    current_user: Dict = Depends(get_current_user),
    doc_repo: DocumentRepositoryInterface = Depends(get_document_repository)
) -> Any:
    doc = await doc_repo.get(id)
    if not doc or doc.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {
        "doc_id": doc["id"],
        "summary": doc.get("aiAnalysis", {}).get("summary", ""),
        "keyPoints": doc.get("aiAnalysis", {}).get("keyPoints", []),
        "flashcards": doc.get("aiAnalysis", {}).get("flashcards", []),
        "quiz": doc.get("aiAnalysis", {}).get("quiz", []),
        "importantDates": doc.get("aiAnalysis", {}).get("importantDates", [])
    }

@router.post("/search", response_model=DocSearchResponseSchema)
async def search_documents(
    query_in: DocSearchSchema,
    current_user: Dict = Depends(get_current_user),
    doc_repo: DocumentRepositoryInterface = Depends(get_document_repository)
) -> Any:
    """RAG-based search across user's uploaded documents."""
    docs = await doc_repo.get_by_user(current_user["id"])
    
    # If specific docs are chosen, filter by them
    if query_in.document_ids:
        docs = [d for d in docs if d["id"] in query_in.document_ids]
        
    if not docs:
        return {"answer": "No documents available to query.", "sources": []}
        
    # Run RAG matching
    rag_result = DocumentService.search_rag_chunks(query_in.query, docs)
    return rag_result
