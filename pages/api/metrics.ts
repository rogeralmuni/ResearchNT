import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Get metrics for a specific startup
        const { startupId } = req.query;
        
        if (!startupId) {
          return res.status(400).json({ error: 'Startup ID is required' });
        }

        const metrics = db.prepare('SELECT * FROM metrics WHERE startup_id = ?').get(startupId);
        
        res.status(200).json({ metrics: metrics || {} });
        break;

      case 'POST':
        // Create or update metrics
        const { startupId: postStartupId, ...metricsData } = req.body;
        
        if (!postStartupId) {
          return res.status(400).json({ error: 'Startup ID is required' });
        }

        const upsertMetrics = db.prepare(`
          INSERT INTO metrics (startup_id, arr, mrr, cac, ltv, churn, runway, burn_rate, customer_count, revenue_growth)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(startup_id) DO UPDATE SET
            arr = excluded.arr,
            mrr = excluded.mrr,
            cac = excluded.cac,
            ltv = excluded.ltv,
            churn = excluded.churn,
            runway = excluded.runway,
            burn_rate = excluded.burn_rate,
            customer_count = excluded.customer_count,
            revenue_growth = excluded.revenue_growth,
            updated_at = CURRENT_TIMESTAMP
        `);

        const result = upsertMetrics.run(
          postStartupId,
          metricsData.arr || null,
          metricsData.mrr || null,
          metricsData.cac || null,
          metricsData.ltv || null,
          metricsData.churn || null,
          metricsData.runway || null,
          metricsData.burn_rate || null,
          metricsData.customer_count || null,
          metricsData.revenue_growth || null
        );

        res.status(200).json({ message: 'Metrics saved successfully' });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in metrics API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 