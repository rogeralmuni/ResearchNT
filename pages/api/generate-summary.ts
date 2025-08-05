import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';
import { getDatabase } from '../../lib/database';

interface Document {
  name: string;
  type: string;
  summary?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId } = req.body;
    if (!startupId) {
      return res.status(400).json({ error: 'Startup ID is required' });
    }

    const db = getDatabase();

    // Fetch startup information
    const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(startupId);
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // Fetch metrics
    const metrics = db.prepare('SELECT * FROM metrics WHERE startup_id = ?').get(startupId);

    // Fetch documents
    const documents = db.prepare('SELECT * FROM documents WHERE startup_id = ?').all(startupId) as Document[];

    // Prepare context for summary generation
    const context = `
INFORMACIÓN DE LA STARTUP:
- Nombre: ${startup.name}
- Sector: ${startup.sector}
- País: ${startup.country}
- Fase: ${startup.stage}
- Descripción: ${startup.description || 'No disponible'}
- Resumen Ejecutivo: ${startup.executive_summary || 'No disponible'}
- Información del Equipo: ${startup.team_info || 'No disponible'}
- Pros: ${startup.pros || 'No disponible'}
- Contras: ${startup.cons || 'No disponible'}
- Puntos Pendientes: ${startup.pending_points || 'No disponible'}
- Memo: ${startup.memo || 'No disponible'}

MÉTRICAS FINANCIERAS:
${metrics ? 
  `ARR: ${metrics.arr}, MRR: ${metrics.mrr}, CAC: ${metrics.cac}, LTV: ${metrics.ltv}, Churn: ${metrics.churn}%, Runway: ${metrics.runway} meses` : 
  'No hay métricas disponibles'}

DOCUMENTOS DISPONIBLES:
${documents?.map((doc: Document) => 
  `- ${doc.name} (${doc.type}): ${doc.summary || 'Sin resumen'}`
).join('\n') || 'No hay documentos'}

INSTRUCCIONES:
Genera un resumen ejecutivo estructurado de esta startup con las siguientes secciones:

1. PROBLEMA: ¿Qué problema resuelve esta startup? (2-3 frases)

2. SOLUCIÓN: ¿Cómo resuelve el problema? Descripción del producto/servicio (2-3 frases)

3. PRODUCTO: Descripción detallada del producto/servicio, características principales, diferenciación (3-4 frases)

4. TECNOLOGÍA IA: ¿Qué tecnologías de IA utiliza? Machine learning, NLP, computer vision, etc. (2-3 frases)

5. EQUIPO: Información clave del equipo fundador, experiencia, background relevante (3-4 frases)

6. MÉTRICAS: Métricas financieras y operacionales más relevantes (ARR, MRR, CAC, LTV, etc.) (2-3 frases)

7. RONDA DE INVERSIÓN: Etapa actual, valoración, uso de fondos, inversores previos (2-3 frases)

8. TESIS DE INVERSIÓN: 
   - RAZONES PARA INVERTIR: Principales pros, ventajas competitivas, oportunidades de mercado
   - RIESGOS: Principales contras, desafíos, amenazas
   - DUDAS: Puntos pendientes, información que falta, validaciones necesarias

El resumen debe ser claro, objetivo y útil para un inversor. Máximo 300 palabras por sección. Usa la información disponible y sé específico.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto analista de inversiones para venture capital. Genera resúmenes ejecutivos claros y estructurados.'
        },
        {
          role: 'user',
          content: context
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    if (!summary) {
      return res.status(500).json({ error: 'No summary generated' });
    }

    // Save the generated summary
    const updateSummary = db.prepare('UPDATE startups SET summary = ? WHERE id = ?');
    updateSummary.run(summary, startupId);

    res.status(200).json({ 
      summary,
      startupName: startup.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Error generating summary' });
  }
}