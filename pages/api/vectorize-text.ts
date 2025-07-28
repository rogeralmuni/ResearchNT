import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: text,
    });

    const embedding = embeddingResponse.data.data[0]?.embedding;
    if (!embedding) {
      return res.status(500).json({ error: 'No embedding returned' });
    }

    res.status(200).json({ embedding });
  } catch (error) {
    console.error('Error vectorizing text:', error);
    res.status(500).json({ error: 'Error vectorizing text' });
  }
} 