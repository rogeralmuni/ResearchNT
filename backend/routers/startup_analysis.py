from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
import json

from schemas import StartupAnalysisRequest, StartupAnalysisResponse, StartupResponse, ErrorResponse
from clients import openai_client, supabase, get_startup_by_id, get_documents_by_startup_id, get_metrics_by_startup_id, get_notes_by_startup_id, save_analysis_history

router = APIRouter()

@router.post("/analyze-startup", response_model=StartupAnalysisResponse)
async def analyze_startup(request: StartupAnalysisRequest):
    """
    Analyze a startup for investment opportunities
    """
    try:
        # 1. Fetch startup data
        startup = await get_startup_by_id(request.startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")

        # 2. Fetch all documents for this startup
        documents = await get_documents_by_startup_id(request.startup_id)

        # 3. Fetch metrics
        metrics = await get_metrics_by_startup_id(request.startup_id)

        # 4. Fetch notes
        notes = await get_notes_by_startup_id(request.startup_id)

        # 5. Prepare context for AI analysis
        documents_text = ""
        if documents:
            documents_text = "\n\n".join([
                f"Documento: {doc.get('name', 'N/A')}\n"
                f"Tipo: {doc.get('type', 'N/A')}\n"
                f"Resumen: {doc.get('summary', 'No disponible')}\n"
                f"KPIs: {doc.get('kpis', 'No disponible')}\n"
                f"Red Flags: {doc.get('red_flags', 'No disponible')}"
                for doc in documents
            ])
        else:
            documents_text = "No hay documentos"

        metrics_text = "No hay métricas disponibles"
        if metrics:
            metrics_text = f"Métricas: ARR={metrics.get('arr', 'N/A')}, MRR={metrics.get('mrr', 'N/A')}, CAC={metrics.get('cac', 'N/A')}, LTV={metrics.get('ltv', 'N/A')}, Churn={metrics.get('churn', 'N/A')}, Runway={metrics.get('runway', 'N/A')} meses"

        notes_text = "No hay notas"
        if notes:
            notes_text = "\n".join([
                f"Nota ({datetime.fromisoformat(note['created_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')}): {note['content']}"
                for note in notes
            ])

        analysis_prompt = f"""
Analiza la siguiente startup para inversión:

INFORMACIÓN DE LA STARTUP:
- Nombre: {startup.get('name', 'N/A')}
- Sector: {startup.get('sector', 'N/A')}
- País: {startup.get('country', 'N/A')}
- Fase: {startup.get('stage', 'N/A')}
- Descripción: {startup.get('description', 'No disponible')}

DOCUMENTOS ANALIZADOS:
{documents_text}

MÉTRICAS FINANCIERAS:
{metrics_text}

NOTAS INTERNAS:
{notes_text}

Por favor, genera un análisis completo de inversión con la siguiente estructura:

## RESUMEN EJECUTIVO
[2-3 párrafos con el resumen de la oportunidad]

## PROS DE LA INVERSIÓN
- [Lista de 3-5 puntos fuertes]
- [Incluir métricas positivas, equipo, producto, mercado]

## CONTRAS Y RIESGOS
- [Lista de 3-5 puntos débiles o riesgos]
- [Incluir métricas negativas, red flags, incertidumbres]

## PUNTOS PENDIENTES DE VALIDAR
- [Lista de 5-8 preguntas críticas para due diligence]
- [Incluir validaciones de equipo, producto, mercado, finanzas]

## RECOMENDACIÓN
[Invertir / No invertir / Más información necesaria] con justificación.

## VALORACIÓN PRELIMINAR
[Valoración de 1-10 en diferentes aspectos: Equipo, Producto, Mercado, Finanzas, Riesgo]
"""

        # Generate analysis using OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un analista experto de venture capital especializado en análisis de inversión de startups."},
                {"role": "user", "content": analysis_prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        analysis = response.choices[0].message.content.strip()
        if not analysis:
            raise HTTPException(status_code=500, detail="No analysis generated")

        # Save analysis to history
        await save_analysis_history(
            startup_id=request.startup_id,
            analysis_type="investment",
            content=analysis,
            trigger="manual"
        )

        # Prepare startup response
        startup_response = StartupResponse(
            id=startup['id'],
            name=startup['name'],
            sector=startup.get('sector'),
            stage=startup.get('stage'),
            country=startup.get('country'),
            description=startup.get('description'),
            website=startup.get('website'),
            status=startup.get('status'),
            created_at=datetime.fromisoformat(startup['created_at'].replace('Z', '+00:00'))
        )

        return StartupAnalysisResponse(
            analysis=analysis,
            startup=startup_response,
            documents_count=len(documents) if documents else 0,
            has_metrics=bool(metrics),
            notes_count=len(notes) if notes else 0
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing startup: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing startup")