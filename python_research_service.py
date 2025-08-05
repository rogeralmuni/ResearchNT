import os
import asyncio
import json
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
import uvicorn

# Configure OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("⚠️  WARNING: OPENAI_API_KEY environment variable is not set!")
    print("Please set your OpenAI API key:")
    print("export OPENAI_API_KEY='your-api-key-here'")
    print("Or create a .env file with: OPENAI_API_KEY=your-api-key-here")
    print("\nThe service will start but research functionality will be limited.")

client = AsyncOpenAI(api_key=api_key or "dummy-key", timeout=600.0)

# Create FastAPI app
app = FastAPI(title="Research Service", version="1.0.0")

# Define request models
class MarketResearchRequest(BaseModel):
    startupId: str
    startupName: str
    startupDescription: str
    startupSector: str

class CompetitorsResearchRequest(BaseModel):
    startupId: str
    startupName: str
    startupDescription: str
    startupSector: str

async def generate_market_research_prompt(request: MarketResearchRequest) -> str:
    return f"""Conduct comprehensive market research for this startup:

STARTUP INFORMATION:
- Name: {request.startupName}
- Sector: {request.startupSector}
- Description: {request.startupDescription}

RESEARCH REQUIREMENTS:
Please conduct thorough market research covering:

1. MARKET OVERVIEW
   - Search for current Total Addressable Market (TAM) size and growth rates
   - Find recent market reports and industry analysis
   - Identify market maturity and development stage
   - Look for market size projections and forecasts

2. TARGET MARKET ANALYSIS
   - Research customer segments and demographics
   - Find customer behavior and preference data
   - Identify geographic market opportunities
   - Search for customer pain points and needs analysis

3. COMPETITIVE LANDSCAPE
   - Search for direct and indirect competitors
   - Research market leaders and their positioning
   - Find competitive analysis reports
   - Identify market concentration and barriers

4. MARKET TRENDS & OPPORTUNITIES
   - Search for current industry trends and drivers
   - Find technology adoption data and patterns
   - Research regulatory changes and compliance requirements
   - Identify emerging market opportunities

5. MARKET ENTRY STRATEGY
   - Research successful market entry approaches
   - Find pricing strategy best practices
   - Search for distribution channel analysis
   - Identify partnership opportunities

6. RISK ASSESSMENT
   - Search for market risk analysis
   - Research regulatory and compliance risks
   - Find competitive threat assessments
   - Identify mitigation strategies

7. FINANCIAL PROJECTIONS
   - Search for market size projections (3-5 years)
   - Find revenue potential and growth estimates
   - Research investment requirements and funding data
   - Look for comparable company analysis

Use web search to find the most current and relevant information. Include specific data points, market insights, and actionable recommendations. Cite sources when possible and provide a comprehensive, well-structured market research report."""

async def generate_competitors_research_prompt(request: CompetitorsResearchRequest) -> str:
    return f"""Conduct comprehensive competitive research for this startup:

STARTUP INFORMATION:
- Name: {request.startupName}
- Sector: {request.startupSector}
- Description: {request.startupDescription}

RESEARCH REQUIREMENTS:
Please conduct thorough competitive research covering:

1. DIRECT COMPETITORS
   - Search for companies offering similar products/services
   - Find current market leaders in this space
   - Research emerging competitors and startups
   - Identify companies with similar target markets

2. INDIRECT COMPETITORS
   - Search for companies offering alternative solutions
   - Find companies in adjacent markets
   - Research potential future competitors
   - Identify companies that could pivot into this space

3. COMPETITOR ANALYSIS
   - Research company founding dates and history
   - Find current employee counts and company size
   - Search for funding and revenue information
   - Research technology stacks and features
   - Analyze market positioning and strategies

4. COMPETITIVE LANDSCAPE
   - Search for market share data and analysis
   - Find competitive positioning reports
   - Research pricing strategies and models
   - Identify key differentiators and advantages

5. STRATEGIC INSIGHTS
   - Analyze competitive threats and opportunities
   - Research market gaps and underserved segments
   - Find partnership and acquisition opportunities
   - Identify competitive advantages and weaknesses

6. COMPETITOR PROFILES
   For each major competitor identified, provide:
   - Company name and description
   - Founding year and company history
   - Employee count and company size
   - Funding raised and revenue data
   - Technology stack and key features
   - Market positioning and strategy
   - Website and LinkedIn URLs
   - Competitive advantages and weaknesses

Use web search to find the most current and relevant competitor information. Include specific data points, company details, and actionable competitive insights. Provide a comprehensive competitive research report that can be used to populate a competitors database."""

async def stream_research(prompt: str, research_type: str):
    """Stream research results using OpenAI's streaming API"""
    if not api_key:
        yield f"data: {{\"type\": \"error\", \"message\": \"OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.\"}}\n\n"
        return
    
    try:
        system_prompt = f"""You are an expert {research_type} analyst specializing in startup ecosystems. 
        Your role is to conduct comprehensive {research_type} to provide detailed, data-driven analysis for startups.
        
        When researching:
        1. Search for current market data and trends
        2. Find recent industry reports and analysis
        3. Research competitor information and positioning
        4. Gather regulatory and compliance information
        5. Identify market trends and opportunities
        6. Find investment and funding data
        7. Research customer demographics and behavior
        
        Always provide actionable insights and quantitative data where possible."""
        
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.3,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield f"data: {{\"type\": \"content\", \"text\": \"{chunk.choices[0].delta.content}\"}}\n\n"
        
        # Yield completion event
        yield f"data: {{\"type\": \"final_output\", \"text\": \"Research completed successfully.\"}}\n\n"
        
    except Exception as e:
        yield f"data: {{\"type\": \"error\", \"message\": \"{str(e)}\"}}\n\n"

@app.post("/api/research/market/stream")
async def stream_market_research(request: MarketResearchRequest):
    """Stream market research results"""
    
    async def generate():
        try:
            prompt = await generate_market_research_prompt(request)
            
            async for chunk in stream_research(prompt, "market research"):
                yield chunk
                
        except Exception as e:
            yield f"data: {{\"type\": \"error\", \"message\": \"{str(e)}\"}}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/api/research/competitors/stream")
async def stream_competitors_research(request: CompetitorsResearchRequest):
    """Stream competitors research results"""
    
    async def generate():
        try:
            prompt = await generate_competitors_research_prompt(request)
            
            async for chunk in stream_research(prompt, "competitive intelligence"):
                yield chunk
                
        except Exception as e:
            yield f"data: {{\"type\": \"error\", \"message\": \"{str(e)}\"}}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/api/research/market")
async def market_research(request: MarketResearchRequest):
    """Non-streaming market research"""
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    
    try:
        prompt = await generate_market_research_prompt(request)
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert market research analyst specializing in startup ecosystems."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.3
        )
        
        final_output = response.choices[0].message.content or ""
        
        return {
            "analysis": {
                "id": f"market_{request.startupId}",
                "startup_id": request.startupId,
                "research_report": final_output,
                "research_status": "completed"
            },
            "research_report": final_output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/research/competitors")
async def competitors_research(request: CompetitorsResearchRequest):
    """Non-streaming competitors research"""
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    
    try:
        prompt = await generate_competitors_research_prompt(request)
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert competitive intelligence analyst specializing in startup ecosystems."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.3
        )
        
        final_output = response.choices[0].message.content or ""
        
        return {
            "research": {
                "id": f"competitors_{request.startupId}",
                "startup_id": request.startupId,
                "research_report": final_output,
                "research_status": "completed"
            },
            "research_report": final_output
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Research Service is running",
        "status": "healthy",
        "api_key_configured": bool(api_key)
    }

if __name__ == "__main__":
    print("🚀 Starting Python Research Service...")
    print("Service will be available at: http://localhost:8001")
    print("API Documentation: http://localhost:8001/docs")
    print("Health Check: http://localhost:8001/")
    
    if not api_key:
        print("\n⚠️  IMPORTANT: OpenAI API key not configured!")
        print("To enable research functionality, set your API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        print("Or create a .env file with: OPENAI_API_KEY=your-api-key-here")
        print("\nThe service will start but research endpoints will return errors.")
    
    uvicorn.run(app, host="0.0.0.0", port=8001) 