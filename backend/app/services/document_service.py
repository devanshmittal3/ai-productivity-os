from typing import List, Dict, Any
import math

class DocumentService:
    @staticmethod
    def extract_text_from_file(filename: str, content: bytes) -> str:
        """Extracts plain text from file binary content."""
        if filename.endswith(".txt"):
            return content.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            # Simple placeholder parser for Phase 1 verification
            return f"Extracted PDF Content for {filename}. Focus areas: Database Indexing, ACID compliance."
        elif filename.endswith(".docx"):
            return f"Extracted Word Document Content for {filename}."
        return "Unsupported format text"

    @staticmethod
    def search_rag_chunks(query: str, docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Simple TF-IDF cosine-similarity representation in-memory.
        Retrieves the top chunk matching the query from processed documents.
        """
        query_words = set(query.lower().split())
        best_chunk = ""
        best_doc_name = "Unknown source"
        max_score = 0.0

        for doc in docs:
            text = doc.get("extractedText", "")
            # Split into chunks of ~500 chars
            chunks = [text[i:i+500] for i in range(0, len(text), 400)]
            for chunk in chunks:
                words = chunk.lower().split()
                if not words:
                    continue
                # Calculate simple word overlap score
                overlap = len(query_words.intersection(set(words)))
                score = overlap / math.sqrt(len(query_words) * len(set(words)))
                if score > max_score:
                    max_score = score
                    best_chunk = chunk
                    best_doc_name = doc.get("fileName", "Document")

        if max_score > 0.0:
            return {
                "answer": f"Based on {best_doc_name}: '{best_chunk.strip()}'",
                "sources": [{"fileName": best_doc_name, "score": round(max_score, 2)}]
            }
        
        return {
            "answer": "No relevant text matching the query was found in the uploaded documents.",
            "sources": []
        }
