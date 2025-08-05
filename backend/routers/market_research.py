from fastapi import APIRouter, HTTPException
from datetime import datetime

from schemas import MarketResearchRequest, MarketResearchResponse, ErrorResponse
from clients import openai_client, save_analysis_history

router = APIRouter()

@router.post("/research-market", response_model=MarketResearchResponse)
async def research_market(request: MarketResearchRequest):
    """
    Generate comprehensive market research for a startup
    """
    try:
        if not request.startup_name.strip() or not request.sector.strip():
            raise HTTPException(status_code=400, detail="Startup name and sector are required")

        # Research prompt for market analysis
        research_prompt = f"""
Realiza un análisis de mercado completo para la siguiente startup:

EMPRESA: {request.startup_name}
SECTOR: {request.sector}
DESCRIPCIÓN: {request.description or 'No disponible'}

Por favor, genera un análisis de mercado estructurado con la siguiente información:

## ANÁLISIS DE MERCADO

### Tamaño de Mercado (TAM/SAM/SOM)
- TAM (Total Addressable Market): [Estimación del mercado total]
- SAM (Serviceable Addressable Market): [Mercado alcanzable]
- SOM (Serviceable Obtainable Market): [Mercado que pueden capturar en 3-5 años]

### Competidores Directos
- [Lista de 5-8 competidores principales con breve descripción]
- [Incluir información sobre funding, tamaño, ventaja competitiva]

### Competidores Indirectos
- [Lista de 3-5 competidores indirectos o sustitutos]
- [Explicar por qué son relevantes]

### Tendencias del Mercado
- [3-5 tendencias principales que afectan este sector]
- [Incluir datos de crecimiento, regulaciones, cambios tecnológicos]

### Barreras de Entrada
- [Lista de barreras para nuevos competidores]
- [Incluir regulaciones, costos, tecnología, red effects]

### Drivers de Crecimiento
- [Factores que impulsan el crecimiento del mercado]
- [Incluir cambios demográficos, tecnológicos, regulatorios]

### Riesgos del Mercado
- [Principales riesgos para este sector/mercado]
- [Incluir competencia, regulación, cambios tecnológicos]

## RECOMENDACIONES
- [3-5 recomendaciones para la startup basadas en el análisis de mercado]
- [Incluir estrategias de posicionamiento, diferenciación, expansión]

Nota: Este análisis se basa en información pública disponible. Para un análisis más preciso, se recomienda investigación adicional.
"""

        # Generate market analysis using OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto analista de mercados especializado en análisis competitivo y de industria para startups."},
                {"role": "user", "content": research_prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )

        market_analysis = response.choices[0].message.content.strip()
        if not market_analysis:
            raise HTTPException(status_code=500, detail="No market analysis generated")

        # Save market research to history if startup_id is provided
        if request.startup_id:
            await save_analysis_history(
                startup_id=request.startup_id,
                analysis_type="market_research",
                content=market_analysis,
                trigger="manual"
            )

        return MarketResearchResponse(
            market_analysis=market_analysis,
            startup_name=request.startup_name,
            sector=request.sector,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in market research: {e}")
        raise HTTPException(status_code=500, detail="Error in market research")