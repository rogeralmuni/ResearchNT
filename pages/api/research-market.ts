import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupName, sector, description } = req.body;
    if (!startupName || !sector) {
      return res.status(400).json({ error: 'Startup name and sector are required' });
    }

    // Research prompt for market analysis
    const researchPrompt = `
Realiza un análisis de mercado completo para la siguiente startup:

EMPRESA: ${startupName}
SECTOR: ${sector}
DESCRIPCIÓN: ${description || 'No disponible'}

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
`;

    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: researchPrompt,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const marketAnalysis = completion.data.choices[0]?.text?.trim();
    if (!marketAnalysis) {
      return res.status(500).json({ error: 'No market analysis generated' });
    }

    // Save market research to history (if startupId is provided)
    const { startupId } = req.body;
    if (startupId) {
      const { error: historyError } = await supabase
        .from('analysis_history')
        .insert({
          startup_id: startupId,
          analysis_type: 'market_research',
          content: marketAnalysis,
          trigger: 'manual',
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error saving market research history:', historyError);
      }
    }

    res.status(200).json({ 
      marketAnalysis,
      startupName,
      sector,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in market research:', error);
    res.status(500).json({ error: 'Error in market research' });
  }
} 