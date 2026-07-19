from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class FlashcardSchema(BaseModel):
    question: str
    answer: str

class QuizQuestionSchema(BaseModel):
    question: str
    options: List[str] = Field(..., min_items=2)
    answerIndex: int = Field(..., ge=0)

class ImportantDateSchema(BaseModel):
    event: str
    date: datetime

class DocAnalysisSchema(BaseModel):
    summary: str
    keyPoints: List[str] = Field(default_factory=list)
    flashcards: List[FlashcardSchema] = Field(default_factory=list)
    quiz: List[QuizQuestionSchema] = Field(default_factory=list)
    importantDates: List[ImportantDateSchema] = Field(default_factory=list)

class DocUploadResponseSchema(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    size: int

class DocInsightsResponseSchema(BaseModel):
    doc_id: str
    summary: str
    keyPoints: List[str]
    flashcards: List[FlashcardSchema]
    quiz: List[QuizQuestionSchema]
    importantDates: List[ImportantDateSchema]

class DocSearchSchema(BaseModel):
    query: str
    document_ids: List[str] = Field(default_factory=list)

class DocSearchResponseSchema(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
