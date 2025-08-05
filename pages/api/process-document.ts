import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate summary
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto analista de documentos de startups. Resume documentos de manera concisa y profesional.'
        },
        {
          role: 'user',
          content: `Resume el siguiente documento de startup de manera concisa y profesional:\n\n${content}\n\nResumen:`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const summary = summaryResponse.choices[0]?.message?.content?.trim();

    // Generate KPIs
    const kpisResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en métricas de startups. Identifica los KPIs más relevantes.'
        },
        {
          role: 'user',
          content: `Identifica los KPIs más relevantes mencionados en este documento:\n\n${content}\n\nKPIs:`
        }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const kpis = kpisResponse.choices[0]?.message?.content?.trim();

    // Generate red flags
    const redFlagsResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en análisis de riesgos para startups. Identifica posibles red flags.'
        },
        {
          role: 'user',
          content: `Identifica posibles red flags o riesgos mencionados en este documento:\n\n${content}\n\nRed Flags:`
        }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const redFlags = redFlagsResponse.choices[0]?.message?.content?.trim();

    res.status(200).json({
      summary: summary || 'No se pudo generar resumen',
      kpis: kpis || 'No se identificaron KPIs',
      redFlags: redFlags || 'No se identificaron red flags',
    });

  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Error processing document' });
  }
} 