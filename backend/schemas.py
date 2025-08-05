from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# Request Models
class StartupAnalysisRequest(BaseModel):
    startup_id: str = Field(..., description="ID of the startup to analyze")

class ChatAnalysisRequest(BaseModel):
    startup_id: str = Field(..., description="ID of the startup")
    message: str = Field(..., description="User message")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Chat history")

class DocumentProcessRequest(BaseModel):
    content: str = Field(..., description="Document content to process")
    document_name: Optional[str] = Field(None, description="Name of the document")

class ExtractTextRequest(BaseModel):
    file_base64: str = Field(..., description="Base64 encoded file")
    file_type: str = Field(..., description="MIME type of the file")

class VectorizeTextRequest(BaseModel):
    text: str = Field(..., description="Text to vectorize")

class MarketResearchRequest(BaseModel):
    startup_name: str = Field(..., description="Name of the startup")
    sector: str = Field(..., description="Sector/industry of the startup")
    description: Optional[str] = Field(None, description="Description of the startup")
    startup_id: Optional[str] = Field(None, description="ID of the startup (optional)")

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    startup_id: Optional[str] = Field(None, description="Filter by startup ID")
    limit: Optional[int] = Field(default=10, description="Number of results to return")

class AnalysisHistoryRequest(BaseModel):
    startup_id: str = Field(..., description="ID of the startup")
    analysis_type: Optional[str] = Field(None, description="Type of analysis to filter")
    limit: Optional[int] = Field(default=10, description="Number of results to return")

class DownloadMemoRequest(BaseModel):
    startup_id: str = Field(..., description="ID of the startup")
    analysis_content: str = Field(..., description="Analysis content for the memo")

# Response Models
class StartupResponse(BaseModel):
    id: str
    name: str
    sector: Optional[str]
    stage: Optional[str]
    country: Optional[str]
    description: Optional[str]
    website: Optional[str]
    status: Optional[str]
    created_at: datetime

class DocumentResponse(BaseModel):
    id: str
    startup_id: str
    name: Optional[str]
    type: Optional[str]
    url: Optional[str]
    summary: Optional[str]
    kpis: Optional[Dict[str, Any]]
    red_flags: Optional[str]
    uploaded_at: datetime

class MetricResponse(BaseModel):
    id: str
    startup_id: str
    arr: Optional[float]
    mrr: Optional[float]
    cac: Optional[float]
    ltv: Optional[float]
    churn: Optional[float]
    runway: Optional[float]
    updated_at: datetime

class NoteResponse(BaseModel):
    id: str
    startup_id: str
    content: str
    created_at: datetime

class AnalysisHistoryResponse(BaseModel):
    id: str
    startup_id: str
    analysis_type: str
    content: str
    trigger: str
    created_at: datetime

class StartupAnalysisResponse(BaseModel):
    analysis: str
    startup: StartupResponse
    documents_count: int
    has_metrics: bool
    notes_count: int

class ChatAnalysisResponse(BaseModel):
    response: str
    startup_name: str
    timestamp: datetime

class DocumentProcessResponse(BaseModel):
    summary: str
    kpis: str
    red_flags: str

class ExtractTextResponse(BaseModel):
    text: str

class VectorizeTextResponse(BaseModel):
    embedding: List[float]

class MarketResearchResponse(BaseModel):
    market_analysis: str
    startup_name: str
    sector: str
    timestamp: datetime

class SemanticSearchResponse(BaseModel):
    results: List[DocumentResponse]
    query: str
    total_results: int

class AnalysisHistoryListResponse(BaseModel):
    history: List[AnalysisHistoryResponse]
    startup_id: str
    total_count: int

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None