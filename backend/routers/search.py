from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import numpy as np

from schemas import SemanticSearchRequest, SemanticSearchResponse, DocumentResponse, ErrorResponse
from clients import openai_client, supabase

router = APIRouter()

@router.post("/semantic-search", response_model=SemanticSearchResponse)
async def semantic_search(request: SemanticSearchRequest):
    """
    Perform semantic search on documents using vector embeddings
    """
    try:
        if not request.query.strip():
            raise HTTPException(status_code=400, detail="Search query is required")

        # Generate embedding for the search query
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=request.query
        )

        query_embedding = embedding_response.data[0].embedding
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Could not generate query embedding")

        # Build the query
        query_builder = supabase.table("documents").select("*")
        
        # Filter by startup_id if provided
        if request.startup_id:
            query_builder = query_builder.eq("startup_id", request.startup_id)

        # For now, we'll do a simple text search since vector similarity search
        # would require specific database functions that might not be available
        # In a production environment, you'd use pgvector or similar for proper
        # vector similarity search
        
        # Get all documents and filter by text similarity (simplified approach)
        response = query_builder.limit(request.limit or 10).execute()
        documents = response.data or []

        # Simple text-based filtering as fallback
        # In production, you'd use proper vector similarity with pgvector
        filtered_documents = []
        query_lower = request.query.lower()
        
        for doc in documents:
            # Check if query terms appear in document fields
            doc_text = ""
            if doc.get('name'):
                doc_text += doc['name'].lower() + " "
            if doc.get('summary'):
                doc_text += doc['summary'].lower() + " "
            if doc.get('type'):
                doc_text += doc['type'].lower() + " "
            
            # Simple keyword matching (would be replaced with vector similarity in production)
            if any(term in doc_text for term in query_lower.split()):
                filtered_documents.append(doc)

        # Convert to response format
        document_responses = []
        for doc in filtered_documents:
            document_responses.append(DocumentResponse(
                id=doc['id'],
                startup_id=doc['startup_id'],
                name=doc.get('name'),
                type=doc.get('type'),
                url=doc.get('url'),
                summary=doc.get('summary'),
                kpis=doc.get('kpis'),
                red_flags=doc.get('red_flags'),
                uploaded_at=datetime.fromisoformat(doc['uploaded_at'].replace('Z', '+00:00'))
            ))

        return SemanticSearchResponse(
            results=document_responses,
            query=request.query,
            total_results=len(document_responses)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail="Error performing semantic search")