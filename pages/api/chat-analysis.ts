import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId, message, conversationHistory = [] } = req.body;
    if (!startupId || !message) {
      return res.status(400).json({ error: 'Startup ID and message are required' });
    }

    // 1. Fetch startup context
    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select('*')
      .eq('id', startupId)
      .single();

    if (startupError || !startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // 2. Fetch recent documents and analysis
    const { data: documents } = await supabase
      .from('documents')
      .select('name, type, summary, kpis, red_flags')
      .eq('startup_id', startupId)
      .limit(5);

    const { data: metrics } = await supabase
      .from('metrics')
      .select('*')
      .eq('startup_id', startupId)
      .single();

    const { data: notes } = await supabase
      .from('notes')
      .select('content, created_at')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. Prepare context for AI
    const context = `
CONTEXTO DE LA STARTUP:
- Nombre: ${startup.name}
- Sector: ${startup.sector}
- País: ${startup.country}
- Fase: ${startup.stage}
- Descripción: ${startup.description || 'No disponible'}

DOCUMENTOS RECIENTES:
${documents?.map(doc => 
  `- ${doc.name} (${doc.type}): ${doc.summary || 'Sin resumen'}`
).join('\n') || 'No hay documentos'}

MÉTRICAS ACTUALES:
${metrics ? 
  `ARR: ${metrics.arr}, MRR: ${metrics.mrr}, CAC: ${metrics.cac}, LTV: ${metrics.ltv}, Churn: ${metrics.churn}, Runway: ${metrics.runway} meses` : 
  'No hay métricas disponibles'}

NOTAS RECIENTES:
${notes?.map(note => 
  `- ${new Date(note.created_at).toLocaleDateString()}: ${note.content}`
).join('\n') || 'No hay notas'}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory.map((msg: any) => 
  `${msg.role}: ${msg.content}`
).join('\n')}

USUARIO: ${message}

INSTRUCCIONES:
Eres un asistente experto en análisis de inversiones para venture capital. Tu objetivo es ayudar a analizar esta startup y mantener conversaciones productivas sobre:

1. Análisis de inversión (pros/contras, riesgos, oportunidades)
2. Actualización de memos de inversión
3. Research de mercado y competidores
4. Preguntas para due diligence
5. Comparación con otras startups del portfolio
6. Recomendaciones de seguimiento

Responde de forma clara, estructurada y útil. Si el usuario pide actualizar el memo de inversión, proporciona el texto actualizado completo.
`;

    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: context,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.data.choices[0]?.text?.trim();
    if (!response) {
      return res.status(500).json({ error: 'No response generated' });
    }

    res.status(200).json({ 
      response,
      startupName: startup.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat analysis:', error);
    res.status(500).json({ error: 'Error in chat analysis' });
  }
} 