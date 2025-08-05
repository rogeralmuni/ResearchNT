from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime
import io
import os
import tempfile

from schemas import (
    AnalysisHistoryRequest, AnalysisHistoryListResponse, AnalysisHistoryResponse,
    DownloadMemoRequest, ErrorResponse
)
from clients import supabase, get_startup_by_id

# Try to import reportlab for PDF generation
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

router = APIRouter()

@router.post("/analysis-history", response_model=AnalysisHistoryListResponse)
async def get_analysis_history(request: AnalysisHistoryRequest):
    """
    Get analysis history for a startup
    """
    try:
        # Verify startup exists
        startup = await get_startup_by_id(request.startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")

        # Build query
        query_builder = supabase.table("analysis_history").select("*").eq("startup_id", request.startup_id)
        
        # Filter by analysis type if provided
        if request.analysis_type:
            query_builder = query_builder.eq("analysis_type", request.analysis_type)
        
        # Order by creation date (newest first) and limit
        query_builder = query_builder.order("created_at", desc=True).limit(request.limit or 10)
        
        response = query_builder.execute()
        history_data = response.data or []

        # Convert to response format
        history_responses = []
        for item in history_data:
            history_responses.append(AnalysisHistoryResponse(
                id=item['id'],
                startup_id=item['startup_id'],
                analysis_type=item['analysis_type'],
                content=item['content'],
                trigger=item['trigger'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
            ))

        return AnalysisHistoryListResponse(
            history=history_responses,
            startup_id=request.startup_id,
            total_count=len(history_responses)
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching analysis history: {e}")
        raise HTTPException(status_code=500, detail="Error fetching analysis history")

@router.post("/download-memo")
async def download_memo(request: DownloadMemoRequest):
    """
    Generate and download a PDF memo for a startup analysis
    """
    try:
        # Verify startup exists
        startup = await get_startup_by_id(request.startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")

        if not REPORTLAB_AVAILABLE:
            # Fallback: return plain text file
            return _generate_text_memo(startup, request.analysis_content)
        
        # Generate PDF memo
        return _generate_pdf_memo(startup, request.analysis_content)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating memo: {e}")
        raise HTTPException(status_code=500, detail="Error generating memo")

def _generate_text_memo(startup: dict, analysis_content: str):
    """Generate a plain text memo file"""
    memo_content = f"""
INVESTMENT MEMO - {startup.get('name', 'N/A')}
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

STARTUP INFORMATION:
- Name: {startup.get('name', 'N/A')}
- Sector: {startup.get('sector', 'N/A')}
- Stage: {startup.get('stage', 'N/A')}
- Country: {startup.get('country', 'N/A')}
- Description: {startup.get('description', 'No description available')}

ANALYSIS:
{analysis_content}

---
This memo was generated automatically by the Startup Analysis Platform.
"""
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
    temp_file.write(memo_content)
    temp_file.close()
    
    filename = f"memo_{startup.get('name', 'startup').replace(' ', '_')}.txt"
    
    return FileResponse(
        path=temp_file.name,
        filename=filename,
        media_type='text/plain'
    )

def _generate_pdf_memo(startup: dict, analysis_content: str):
    """Generate a PDF memo file using ReportLab"""
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
    temp_file.close()
    
    # Create PDF document
    doc = SimpleDocTemplate(temp_file.name, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph(f"INVESTMENT MEMO - {startup.get('name', 'N/A')}", title_style))
    story.append(Spacer(1, 12))
    
    # Date
    date_style = styles['Normal']
    story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
    story.append(Spacer(1, 20))
    
    # Startup Information
    heading_style = styles['Heading2']
    story.append(Paragraph("STARTUP INFORMATION", heading_style))
    story.append(Spacer(1, 12))
    
    info_style = styles['Normal']
    startup_info = [
        f"<b>Name:</b> {startup.get('name', 'N/A')}",
        f"<b>Sector:</b> {startup.get('sector', 'N/A')}",
        f"<b>Stage:</b> {startup.get('stage', 'N/A')}",
        f"<b>Country:</b> {startup.get('country', 'N/A')}",
        f"<b>Description:</b> {startup.get('description', 'No description available')}"
    ]
    
    for info in startup_info:
        story.append(Paragraph(info, info_style))
        story.append(Spacer(1, 6))
    
    story.append(Spacer(1, 20))
    
    # Analysis
    story.append(Paragraph("ANALYSIS", heading_style))
    story.append(Spacer(1, 12))
    
    # Split analysis content into paragraphs
    analysis_paragraphs = analysis_content.split('\n\n')
    for para in analysis_paragraphs:
        if para.strip():
            story.append(Paragraph(para.strip(), info_style))
            story.append(Spacer(1, 10))
    
    # Footer
    story.append(Spacer(1, 30))
    footer_style = styles['Italic']
    story.append(Paragraph("This memo was generated automatically by the Startup Analysis Platform.", footer_style))
    
    # Build PDF
    doc.build(story)
    
    filename = f"memo_{startup.get('name', 'startup').replace(' ', '_')}.pdf"
    
    return FileResponse(
        path=temp_file.name,
        filename=filename,
        media_type='application/pdf'
    )