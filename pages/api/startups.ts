import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDatabase();
    const { search } = req.query;
    
    // Get the 10 startups with the highest IDs
    let query = `
      SELECT id, name, description, sector, stage, country, team_info, memo, created_at, updated_at
      FROM startups 
      ORDER BY CAST(id AS INTEGER) DESC 
      LIMIT 10
    `;
    
    let startups = db.prepare(query).all();

    // Map the database results to the expected format
    startups = startups.map(startup => ({
      id: startup.id,
      name: startup.name,
      sector: startup.sector || 'Technology',
      stage: startup.stage || 'Seed',
      country: startup.country || 'Unknown',
      description: startup.description,
      team_info: startup.team_info,
      memo: startup.memo,
      created_at: startup.created_at,
      updated_at: startup.updated_at
    }));

    // Apply search filter if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      startups = startups.filter(startup => 
        startup.name.toLowerCase().includes(searchLower) ||
        startup.description?.toLowerCase().includes(searchLower) ||
        startup.sector.toLowerCase().includes(searchLower) ||
        startup.stage.toLowerCase().includes(searchLower) ||
        startup.country.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({ startups });

  } catch (error) {
    console.error('Error fetching startups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 