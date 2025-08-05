from fastapi import APIRouter, HTTPException, File, UploadFile
import base64
import io
from typing import List
import json

# Import document processing libraries
try:
    import PyPDF2
    from docx import Document as DocxDocument
except ImportError:
    PyPDF2 = None
    DocxDocument = None

from schemas import (
    ExtractTextRequest, ExtractTextResponse,
    DocumentProcessRequest, DocumentProcessResponse,
    VectorizeTextRequest, VectorizeTextResponse,
    ErrorResponse
)
from clients import openai_client

router = APIRouter()

@router.post("/extract-text", response_model=ExtractTextResponse)
async def extract_text(request: ExtractTextRequest):
    """
    Extract text from uploaded files (PDF, DOCX)
    """
    try:
        # Decode base64 file
        try:
            file_bytes = base64.b64decode(request.file_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid base64 encoding")

        text = ""

        if request.file_type == "application/pdf":
            # PDF extraction
            if PyPDF2 is None:
                raise HTTPException(status_code=500, detail="PDF processing not available - PyPDF2 not installed")
            
            try:
                pdf_file = io.BytesIO(file_bytes)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                    
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")

        elif request.file_type in [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
        ]:
            # DOCX extraction
            if DocxDocument is None:
                raise HTTPException(status_code=500, detail="DOCX processing not available - python-docx not installed")
            
            try:
                docx_file = io.BytesIO(file_bytes)
                doc = DocxDocument(docx_file)
                
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                    
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error processing DOCX: {str(e)}")

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")

        return ExtractTextResponse(text=text.strip())

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail="Error extracting text")

@router.post("/process-document", response_model=DocumentProcessResponse)
async def process_document(request: DocumentProcessRequest):
    """
    Process document content to extract summary, KPIs, and red flags
    """
    try:
        if not request.content.strip():
            raise HTTPException(status_code=400, detail="Content is required")

        # Generate summary
        summary_response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto analista de documentos de startups."},
                {"role": "user", "content": f"Resume el siguiente documento de startup de manera concisa y profesional:\n\n{request.content}\n\nResumen:"}
            ],
            max_tokens=200,
            temperature=0.3
        )

        # Extract KPIs
        kpis_response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto analista financiero especializado en startups."},
                {"role": "user", "content": f"Extrae los KPIs más importantes del siguiente documento de startup. Devuelve solo los KPIs en formato JSON con valores numéricos:\n\n{request.content}\n\nKPIs:"}
            ],
            max_tokens=300,
            temperature=0.1
        )

        # Identify red flags
        red_flags_response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto analista de riesgos en inversiones de startups."},
                {"role": "user", "content": f"Identifica posibles red flags o riesgos en el siguiente documento de startup. Sé específico y conciso:\n\n{request.content}\n\nRed flags:"}
            ],
            max_tokens=200,
            temperature=0.3
        )

        summary = summary_response.choices[0].message.content.strip() if summary_response.choices[0].message.content else "No se pudo generar resumen"
        kpis = kpis_response.choices[0].message.content.strip() if kpis_response.choices[0].message.content else "No se pudieron extraer KPIs"
        red_flags = red_flags_response.choices[0].message.content.strip() if red_flags_response.choices[0].message.content else "No se identificaron red flags"

        return DocumentProcessResponse(
            summary=summary,
            kpis=kpis,
            red_flags=red_flags
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail="Error processing document")

@router.post("/vectorize-text", response_model=VectorizeTextResponse)
async def vectorize_text(request: VectorizeTextRequest):
    """
    Create vector embeddings from text for semantic search
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        # Generate embeddings using OpenAI
        embedding_response = openai_client.embeddings.create(
            model="text-embedding-ada-002",
            input=request.text
        )

        embedding = embedding_response.data[0].embedding
        if not embedding:
            raise HTTPException(status_code=500, detail="No embedding returned")

        return VectorizeTextResponse(embedding=embedding)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error vectorizing text: {e}")
        raise HTTPException(status_code=500, detail="Error vectorizing text")