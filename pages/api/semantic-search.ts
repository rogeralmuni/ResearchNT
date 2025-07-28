import { NextApiRequest, NextApiResponse } from 'next';
import { openai } from '../../lib/openaiClient';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, table } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const targetTable = table === 'documents' ? 'documents' : 'startups';

    // 1. Vectorize the query
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data.data[0]?.embedding;
    if (!queryEmbedding) {
      return res.status(500).json({ error: 'No embedding returned' });
    }

    // 2. Search in Supabase using pgvector (cosine similarity)
    // Assumes 'embedding' column exists and is a vector type
    // Use the pgvector extension: https://supabase.com/docs/guides/database/extensions/pgvector
    const { data, error } = await supabase.rpc('match_similar_'+targetTable, {
      query_embedding: queryEmbedding,
      match_count: 5,
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ results: data });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Error in semantic search' });
  }
} 