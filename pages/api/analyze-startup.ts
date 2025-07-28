import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId } = req.body;
    if (!startupId) {
      return res.status(400).json({ error: 'Startup ID is required' });
    }

    // 1. Fetch startup data
    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select('*')
      .eq('id', startupId)
      .single();

    if (startupError || !startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // 2. Fetch all documents for this startup
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('startup_id', startupId);

    if (docsError) {
      return res.status(500).json({ error: 'Error fetching documents' });
    }

    // 3. Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('startup_id', startupId)
      .single();

    // 4. Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false });

    // 5. Prepare context for AI analysis
    const documentsText = documents?.map(doc => 
      `Documento: ${doc.name}\nTipo: ${doc.type}\nResumen: ${doc.summary || 'No disponible'}\nKPIs: ${doc.kpis || 'No disponible'}\nRed Flags: ${doc.red_flags || 'No disponible'}`
    ).join('\n\n') || 'No hay documentos';

    const metricsText = metrics ? 
      `Métricas: ARR=${metrics.arr}, MRR=${metrics.mrr}, CAC=${metrics.cac}, LTV=${metrics.ltv}, Churn=${metrics.churn}, Runway=${metrics.runway} meses` : 
      'No hay métricas disponibles';

    const notesText = notes?.map(note => 
      `Nota (${new Date(note.created_at).toLocaleDateString()}): ${note.content}`
    ).join('\n') || 'No hay notas';

    const analysisPrompt = `
Analiza la siguiente startup para inversión:

INFORMACIÓN DE LA STARTUP:
- Nombre: ${startup.name}
- Sector: ${startup.sector}
- País: ${startup.country}
- Fase: ${startup.stage}
- Descripción: ${startup.description || 'No disponible'}

DOCUMENTOS ANALIZADOS:
${documentsText}

MÉTRICAS FINANCIERAS:
${metricsText}

NOTAS INTERNAS:
${notesText}

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
`;

    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: analysisPrompt,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const analysis = completion.data.choices[0]?.text?.trim();
    if (!analysis) {
      return res.status(500).json({ error: 'No analysis generated' });
    }

    // Save analysis to history
    const { error: historyError } = await supabase
      .from('analysis_history')
      .insert({
        startup_id: startupId,
        analysis_type: 'investment',
        content: analysis,
        trigger: 'manual',
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error saving analysis history:', historyError);
    }

    res.status(200).json({ 
      analysis,
      startup,
      documentsCount: documents?.length || 0,
      hasMetrics: !!metrics,
      notesCount: notes?.length || 0
    });

  } catch (error) {
    console.error('Error analyzing startup:', error);
    res.status(500).json({ error: 'Error analyzing startup' });
  }
} 