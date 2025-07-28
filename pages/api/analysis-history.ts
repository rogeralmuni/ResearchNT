import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get analysis history for a startup
    const { startupId } = req.query;
    
    if (!startupId) {
      return res.status(400).json({ error: 'Startup ID is required' });
    }

    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ history: data });
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      res.status(500).json({ error: 'Error fetching analysis history' });
    }
  } else if (req.method === 'POST') {
    // Save new analysis entry
    const { startupId, analysisType, content, trigger } = req.body;
    
    if (!startupId || !analysisType || !content) {
      return res.status(400).json({ error: 'Startup ID, analysis type, and content are required' });
    }

    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .insert({
          startup_id: startupId,
          analysis_type: analysisType, // 'investment', 'market_research', 'chat'
          content: content,
          trigger: trigger || 'manual', // 'manual', 'document_upload', 'metrics_update', 'note_added'
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ analysis: data });
    } catch (error) {
      console.error('Error saving analysis:', error);
      res.status(500).json({ error: 'Error saving analysis' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 