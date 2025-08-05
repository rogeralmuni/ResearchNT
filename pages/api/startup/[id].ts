import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Get a specific startup
        const startup = db.startups.find(s => s.id === id);
        
        if (!startup) {
          return res.status(404).json({ error: 'Startup not found' });
        }

        res.status(200).json(startup);
        break;

      case 'PUT':
        // Update a startup
        const { name, description, founded_year, employee_count, funding_raised, revenue, linkedin_url, website_url } = req.body;
        
        const startupIndex = db.startups.findIndex(s => s.id === id);
        
        if (startupIndex === -1) {
          return res.status(404).json({ error: 'Startup not found' });
        }

        // Update the startup in the mock data
        db.startups[startupIndex] = {
          ...db.startups[startupIndex],
          name: name || db.startups[startupIndex].name,
          description: description || db.startups[startupIndex].description,
          founded_year: founded_year || db.startups[startupIndex].founded_year,
          employee_count: employee_count || db.startups[startupIndex].employee_count,
          funding_raised: funding_raised || db.startups[startupIndex].funding_raised,
          revenue: revenue || db.startups[startupIndex].revenue,
          linkedin_url: linkedin_url || db.startups[startupIndex].linkedin_url,
          website_url: website_url || db.startups[startupIndex].website_url,
          updated_at: new Date().toISOString()
        };

        res.status(200).json(db.startups[startupIndex]);
        break;

      case 'DELETE':
        // Delete a startup
        const deleteIndex = db.startups.findIndex(s => s.id === id);
        
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Startup not found' });
        }

        db.startups.splice(deleteIndex, 1);
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in startup API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 