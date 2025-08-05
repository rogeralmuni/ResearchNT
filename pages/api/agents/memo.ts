import { NextApiRequest, NextApiResponse } from 'next';
import { MemoAgent, MemoRequest } from '../../../agents/MemoAgent';
import { getDatabase } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId, action } = req.body;
    
    if (!startupId || !action) {
      return res.status(400).json({ error: 'Startup ID and action are required' });
    }

    const db = getDatabase();
    
    // Get startup information
    const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(startupId);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // Get metrics
    const metrics = db.prepare('SELECT * FROM metrics WHERE startup_id = ?').get(startupId);

    // Get competitors
    const competitors = db.prepare('SELECT * FROM competitors WHERE startup_id = ?').all(startupId);

    // Get market analysis
    const marketAnalysis = db.prepare('SELECT * FROM market_analysis WHERE startup_id = ?').get(startupId);

    // Get documents
    const documents = db.prepare('SELECT * FROM documents WHERE startup_id = ?').all(startupId);

    const memoData = {
      startupId,
      startupName: startup.name,
      startupDescription: startup.description || '',
      startupSector: startup.sector || '',
      teamInfo: startup.team_info,
      metrics: metrics ? {
        arr: metrics.arr,
        mrr: metrics.mrr,
        cac: metrics.cac,
        ltv: metrics.ltv,
        churn: metrics.churn,
        runway: metrics.runway
      } : undefined,
      competitors: competitors.length > 0 ? competitors.map(c => ({
        name: c.competitor_name,
        description: c.description,
        strengths: [],
        weaknesses: []
      })) : undefined,
      marketAnalysis: marketAnalysis ? {
        researchReport: marketAnalysis.research_report
      } : undefined,
      documents: documents.length > 0 ? documents.map(d => ({
        name: d.name,
        summary: d.summary || '',
        kpis: d.kpis || '',
        redFlags: d.red_flags || ''
      })) : undefined
    };

    const request: MemoRequest = {
      startupId,
      startupName: startup.name,
      startupDescription: startup.description || '',
      startupSector: startup.sector || '',
      action: action as 'generate' | 'update' | 'enhance',
      memoData,
      existingMemo: startup.memo
    };

    let response;
    switch (action) {
      case 'generate':
        response = await MemoAgent.generateMemo(request);
        break;
      case 'update':
        response = await MemoAgent.updateMemo(request);
        break;
      case 'enhance':
        response = await MemoAgent.enhanceMemo(request);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Save memo to database
    const updateMemo = db.prepare('UPDATE startups SET memo = ? WHERE id = ?');
    updateMemo.run(response.memo, startupId);

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in memo agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 