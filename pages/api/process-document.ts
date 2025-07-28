import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, documentName } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate summary
    const summaryResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Resume el siguiente documento de startup de manera concisa y profesional:\n\n${content}\n\nResumen:`,
      max_tokens: 200,
      temperature: 0.3,
    });

    // Extract KPIs
    const kpisResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Extrae los KPIs más importantes del siguiente documento de startup. Devuelve solo los KPIs en formato JSON con valores numéricos:\n\n${content}\n\nKPIs:`,
      max_tokens: 300,
      temperature: 0.1,
    });

    // Identify red flags
    const redFlagsResponse = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Identifica posibles red flags o riesgos en el siguiente documento de startup. Sé específico y conciso:\n\n${content}\n\nRed flags:`,
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = {
      summary: summaryResponse.data.choices[0]?.text?.trim() || 'No se pudo generar resumen',
      kpis: kpisResponse.data.choices[0]?.text?.trim() || 'No se pudieron extraer KPIs',
      redFlags: redFlagsResponse.data.choices[0]?.text?.trim() || 'No se identificaron red flags',
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Error processing document' });
  }
} 