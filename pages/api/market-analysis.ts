import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Obtener análisis de mercado de una startup
        const { startupId } = req.query;
        
        if (!startupId) {
          return res.status(400).json({ error: 'startupId es requerido' });
        }

        const marketAnalysis = db.prepare(`
          SELECT * FROM market_analysis 
          WHERE startup_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `).get(startupId);

        res.status(200).json(marketAnalysis || null);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en market-analysis API:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 