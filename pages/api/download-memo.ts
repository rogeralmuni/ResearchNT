import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId, format = 'pdf' } = req.body;
    
    if (!startupId) {
      return res.status(400).json({ error: 'Startup ID is required' });
    }

    // Fetch startup data
    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select('*')
      .eq('id', startupId)
      .single();

    if (startupError) {
      return res.status(500).json({ error: 'Error fetching startup data' });
    }

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('startup_id', startupId);

    if (docsError) {
      return res.status(500).json({ error: 'Error fetching documents' });
    }

    // Fetch metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('startup_id', startupId)
      .single();

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false });

    // Generate memo content
    const memoContent = generateMemoContent(startup, documents, metrics, notes);

    if (format === 'pdf') {
      // For PDF, we'll return a simple text format that can be converted to PDF
      // In a real implementation, you'd use a library like puppeteer or jsPDF
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="memo-${startup.name}-${new Date().toISOString().split('T')[0]}.txt"`);
      return res.status(200).send(memoContent);
    } else if (format === 'word') {
      // For Word, we'll return a simple text format that can be opened in Word
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="memo-${startup.name}-${new Date().toISOString().split('T')[0]}.docx"`);
      return res.status(200).send(memoContent);
    } else {
      return res.status(400).json({ error: 'Invalid format. Use "pdf" or "word"' });
    }

  } catch (error) {
    console.error('Error generating memo:', error);
    res.status(500).json({ error: 'Error generating memo' });
  }
}

function generateMemoContent(startup: any, documents: any[], metrics: any, notes: any[]) {
  const date = new Date().toLocaleDateString('es-ES');
  
  let content = `MEMO DE INVERSIÓN - ${startup.name?.toUpperCase() || 'STARTUP'}
Fecha: ${date}
===============================================

INFORMACIÓN GENERAL
------------------
Nombre: ${startup.name || 'N/A'}
Sector: ${startup.sector || 'N/A'}
País: ${startup.country || 'N/A'}
Etapa: ${startup.stage || 'N/A'}

DOCUMENTOS ANALIZADOS
---------------------
${documents.length} documentos procesados:
${documents.map(doc => `- ${doc.name} (${doc.type})`).join('\n')}

${documents.map(doc => `
${doc.name}:
${doc.summary ? `Resumen: ${doc.summary}` : ''}
${doc.kpis ? `KPIs: ${doc.kpis}` : ''}
${doc.red_flags ? `Red Flags: ${doc.red_flags}` : ''}
`).join('\n')}

MÉTRICAS CLAVE
--------------
${metrics ? `
ARR: ${metrics.arr || 'N/A'}
MRR: ${metrics.mrr || 'N/A'}
CAC: ${metrics.cac || 'N/A'}
LTV: ${metrics.ltv || 'N/A'}
Churn: ${metrics.churn || 'N/A'}%
Runway: ${metrics.runway || 'N/A'} meses
Burn Rate: ${metrics.burn_rate || 'N/A'}
Clientes: ${metrics.customer_count || 'N/A'}
Crecimiento: ${metrics.revenue_growth || 'N/A'}%
` : 'No hay métricas disponibles'}

NOTAS INTERNAS
--------------
${notes.length > 0 ? notes.map(note => `
${new Date(note.created_at).toLocaleDateString('es-ES')}:
${note.content}
`).join('\n') : 'No hay notas internas'}

ANÁLISIS COMPLETO
-----------------
Este memo incluye:
- Análisis de documentos subidos
- Métricas financieras clave
- Notas de reuniones y actividades
- Evaluación de riesgos y oportunidades

Recomendación: Revisar análisis completo en la plataforma para obtener
el análisis detallado generado por IA, incluyendo pros/contras y
puntos pendientes de validación.

===============================================
Generado automáticamente por VC Startup Platform
`;

  return content;
} 