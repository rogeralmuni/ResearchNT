import { NextApiRequest, NextApiResponse } from 'next';
import { CompetitorsAgent, CompetitorsAnalysisRequest, SaveCompetitorRequest } from '../../../agents/CompetitorsAgent';
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
    const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(startupId) as any;
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    // Get existing competitors if any
    const existingCompetitors = db.prepare('SELECT * FROM competitors WHERE startup_id = ?').all(startupId) as any[];

    const request: CompetitorsAnalysisRequest = {
      startupId,
      startupName: startup.name,
      startupDescription: startup.description || '',
      startupSector: startup.sector || '',
      action: action as 'research' | 'analyze' | 'compare',
      existingCompetitors: existingCompetitors.length > 0 ? existingCompetitors : undefined
    };

    let response;
    switch (action) {
      case 'research':
        response = await CompetitorsAgent.researchCompetitors(request);
        break;
      case 'analyze':
        response = await CompetitorsAgent.analyzeCompetitors(request);
        break;
      case 'compare':
        response = await CompetitorsAgent.compareWithCompetitors(request);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Save competitors to database if this is a research action
    if (action === 'research' && response.competitors.length > 0) {
      await saveCompetitorsToDatabase(startupId, response.competitors);
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in competitors agent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Function to save competitors to database with upsert logic
async function saveCompetitorsToDatabase(startupId: string, competitors: any[]) {
  const db = getDatabase();
  
  const upsertCompetitor = db.prepare(`
    INSERT INTO competitors (
      startup_id, competitor_name, description, founded_year, employee_count,
      funding_raised, revenue, linkedin_url, website_url, main_features,
      similarity_score, is_external, research_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(startup_id, competitor_name) DO UPDATE SET
      description = COALESCE(excluded.description, competitors.description),
      founded_year = COALESCE(excluded.founded_year, competitors.founded_year),
      employee_count = COALESCE(excluded.employee_count, competitors.employee_count),
      funding_raised = COALESCE(excluded.funding_raised, competitors.funding_raised),
      revenue = COALESCE(excluded.revenue, competitors.revenue),
      linkedin_url = COALESCE(excluded.linkedin_url, competitors.linkedin_url),
      website_url = COALESCE(excluded.website_url, competitors.website_url),
      main_features = COALESCE(excluded.main_features, competitors.main_features),
      similarity_score = COALESCE(excluded.similarity_score, competitors.similarity_score),
      research_status = 'completed',
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const competitor of competitors) {
    try {
      // Check if competitor already exists
      const existingCompetitor = db.prepare(`
        SELECT * FROM competitors 
        WHERE startup_id = ? AND competitor_name = ?
      `).get(startupId, competitor.competitor_name);

      if (existingCompetitor) {
        // Update existing competitor with new information
        const updateCompetitor = db.prepare(`
          UPDATE competitors SET
            description = COALESCE(?, description),
            founded_year = COALESCE(?, founded_year),
            employee_count = COALESCE(?, employee_count),
            funding_raised = COALESCE(?, funding_raised),
            revenue = COALESCE(?, revenue),
            linkedin_url = COALESCE(?, linkedin_url),
            website_url = COALESCE(?, website_url),
            main_features = COALESCE(?, main_features),
            similarity_score = COALESCE(?, similarity_score),
            research_status = 'completed',
            updated_at = CURRENT_TIMESTAMP
          WHERE startup_id = ? AND competitor_name = ?
        `);

        updateCompetitor.run(
          competitor.description || null,
          competitor.founded_year || null,
          competitor.employee_count || null,
          competitor.funding_raised || null,
          competitor.revenue || null,
          competitor.linkedin_url || null,
          competitor.website_url || null,
          competitor.main_features || null,
          competitor.similarity_score || null,
          startupId,
          competitor.competitor_name
        );
      } else {
        // Insert new competitor
        const insertCompetitor = db.prepare(`
          INSERT INTO competitors (
            startup_id, competitor_name, description, founded_year, employee_count,
            funding_raised, revenue, linkedin_url, website_url, main_features,
            similarity_score, is_external, research_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertCompetitor.run(
          startupId,
          competitor.competitor_name,
          competitor.description || '',
          competitor.founded_year || 0,
          competitor.employee_count || 0,
          competitor.funding_raised || 0,
          competitor.revenue || 0,
          competitor.linkedin_url || '',
          competitor.website_url || '',
          competitor.main_features || '',
          competitor.similarity_score || 0.8,
          competitor.is_external !== false ? 1 : 0, // Convert boolean to integer
          'completed'
        );
      }
    } catch (error) {
      console.error('Error saving competitor:', competitor.competitor_name, error);
    }
  }
}

// API endpoint to handle save_competitor tool calls
export async function saveCompetitor(request: SaveCompetitorRequest) {
  const db = getDatabase();
  
  try {
    const { startupId, competitor } = request;
    
    // Check if competitor already exists
    const existingCompetitor = db.prepare(`
      SELECT * FROM competitors 
      WHERE startup_id = ? AND competitor_name = ?
    `).get(startupId, competitor.competitor_name);

    if (existingCompetitor) {
      // Update existing competitor with new information
      const updateCompetitor = db.prepare(`
        UPDATE competitors SET
          description = COALESCE(?, description),
          founded_year = COALESCE(?, founded_year),
          employee_count = COALESCE(?, employee_count),
          funding_raised = COALESCE(?, funding_raised),
          revenue = COALESCE(?, revenue),
          linkedin_url = COALESCE(?, linkedin_url),
          website_url = COALESCE(?, website_url),
          main_features = COALESCE(?, main_features),
          similarity_score = COALESCE(?, similarity_score),
          research_status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE startup_id = ? AND competitor_name = ?
      `);

      updateCompetitor.run(
        competitor.description || null,
        competitor.founded_year || null,
        competitor.employee_count || null,
        competitor.funding_raised || null,
        competitor.revenue || null,
        competitor.linkedin_url || null,
        competitor.website_url || null,
        competitor.main_features || null,
        competitor.similarity_score || null,
        startupId,
        competitor.competitor_name
      );

      return { success: true, action: 'updated', competitor: competitor.competitor_name };
    } else {
      // Insert new competitor
      const insertCompetitor = db.prepare(`
        INSERT INTO competitors (
          startup_id, competitor_name, description, founded_year, employee_count,
          funding_raised, revenue, linkedin_url, website_url, main_features,
          similarity_score, is_external, research_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertCompetitor.run(
        startupId,
        competitor.competitor_name,
        competitor.description || '',
        competitor.founded_year || 0,
        competitor.employee_count || 0,
        competitor.funding_raised || 0,
        competitor.revenue || 0,
        competitor.linkedin_url || '',
        competitor.website_url || '',
        competitor.main_features || '',
        competitor.similarity_score || 0.8,
        competitor.is_external !== false ? 1 : 0,
        'completed'
      );

      return { success: true, action: 'inserted', competitor: competitor.competitor_name };
    }
  } catch (error) {
    console.error('Error saving competitor:', error);
    return { success: false, error: 'Failed to save competitor' };
  }
} 