from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Import routers
from routers import (
    startup_analysis,
    chat_analysis,
    document_processing,
    market_research,
    search,
    history
)

# Create FastAPI app
app = FastAPI(
    title="Startup Analysis Platform API",
    description="A comprehensive API for analyzing startup companies using AI-powered tools",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(startup_analysis.router, prefix="/api", tags=["Startup Analysis"])
app.include_router(chat_analysis.router, prefix="/api", tags=["Chat Analysis"])
app.include_router(document_processing.router, prefix="/api", tags=["Document Processing"])
app.include_router(market_research.router, prefix="/api", tags=["Market Research"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(history.router, prefix="/api", tags=["History"])

@app.get("/")
async def root():
    return {"message": "Startup Analysis Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )