import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Get competitors research for a startup
        const { startupId } = req.query;
        
        if (!startupId) {
          return res.status(400).json({ error: 'startupId is required' });
        }

        const competitorsResearch = db.prepare(`
          SELECT * FROM competitors_research 
          WHERE startup_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `).get(startupId);

        res.status(200).json(competitorsResearch || null);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }
  } catch (error) {
    console.error('Error in competitors research API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 