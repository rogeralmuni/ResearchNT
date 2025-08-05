from fastapi import APIRouter, HTTPException
from datetime import datetime

from schemas import ChatAnalysisRequest, ChatAnalysisResponse, ErrorResponse
from clients import openai_client, get_startup_by_id, get_documents_by_startup_id, get_metrics_by_startup_id, get_notes_by_startup_id

router = APIRouter()

@router.post("/chat-analysis", response_model=ChatAnalysisResponse)
async def chat_analysis(request: ChatAnalysisRequest):
    """
    Interactive chat analysis for startup insights
    """
    try:
        # 1. Fetch startup context
        startup = await get_startup_by_id(request.startup_id)
        if not startup:
            raise HTTPException(status_code=404, detail="Startup not found")

        # 2. Fetch recent documents and analysis (limit for context)
        documents = await get_documents_by_startup_id(request.startup_id)
        if documents and len(documents) > 5:
            documents = documents[:5]  # Limit to 5 most recent

        metrics = await get_metrics_by_startup_id(request.startup_id)
        notes = await get_notes_by_startup_id(request.startup_id, limit=3)

        # 3. Prepare context for AI
        documents_text = "No hay documentos"
        if documents:
            documents_text = "\n".join([
                f"- {doc.get('name', 'N/A')} ({doc.get('type', 'N/A')}): {doc.get('summary', 'Sin resumen')}"
                for doc in documents
            ])

        metrics_text = "No hay métricas disponibles"
        if metrics:
            metrics_text = f"ARR: {metrics.get('arr', 'N/A')}, MRR: {metrics.get('mrr', 'N/A')}, CAC: {metrics.get('cac', 'N/A')}, LTV: {metrics.get('ltv', 'N/A')}, Churn: {metrics.get('churn', 'N/A')}, Runway: {metrics.get('runway', 'N/A')} meses"

        notes_text = "No hay notas"
        if notes:
            notes_text = "\n".join([
                f"- {datetime.fromisoformat(note['created_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')}: {note['content']}"
                for note in notes
            ])

        conversation_history_text = ""
        if request.conversation_history:
            conversation_history_text = "\n".join([
                f"{msg.get('role', 'user')}: {msg.get('content', '')}"
                for msg in request.conversation_history
            ])

        context = f"""
CONTEXTO DE LA STARTUP:
- Nombre: {startup.get('name', 'N/A')}
- Sector: {startup.get('sector', 'N/A')}
- País: {startup.get('country', 'N/A')}
- Fase: {startup.get('stage', 'N/A')}
- Descripción: {startup.get('description', 'No disponible')}

DOCUMENTOS RECIENTES:
{documents_text}

MÉTRICAS ACTUALES:
{metrics_text}

NOTAS RECIENTES:
{notes_text}

HISTORIAL DE CONVERSACIÓN:
{conversation_history_text}

USUARIO: {request.message}

INSTRUCCIONES:
Eres un asistente experto en análisis de inversiones para venture capital. Tu objetivo es ayudar a analizar esta startup y mantener conversaciones productivas sobre:

1. Análisis de inversión (pros/contras, riesgos, oportunidades)
2. Actualización de memos de inversión
3. Research de mercado y competidores
4. Preguntas para due diligence
5. Comparación con otras startups del portfolio
6. Recomendaciones de seguimiento

Responde de forma clara, estructurada y útil. Si el usuario pide actualizar el memo de inversión, proporciona el texto actualizado completo.
"""

        # Generate response using OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente experto en análisis de inversiones para venture capital."},
                {"role": "user", "content": context}
            ],
            max_tokens=1000,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content.strip()
        if not ai_response:
            raise HTTPException(status_code=500, detail="No response generated")

        return ChatAnalysisResponse(
            response=ai_response,
            startup_name=startup['name'],
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat analysis: {e}")
        raise HTTPException(status_code=500, detail="Error in chat analysis")