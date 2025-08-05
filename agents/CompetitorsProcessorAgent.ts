import { openai } from '../lib/openaiClient';

export interface Competitor {
  id: string;
  competitor_name: string;
  description: string;
  founded_year: number;
  employee_count: number;
  funding_raised: number;
  revenue: number;
  linkedin_url: string;
  website_url: string;
  main_features: string;
  similarity_score: number;
  is_external: boolean;
  research_status: string;
}

export interface CompetitorsProcessorRequest {
  startupId: string;
  researchReport: string;
}

export interface CompetitorsProcessorResponse {
  competitors: Competitor[];
  processedCount: number;
  updatedCount: number;
  errors: string[];
}

export class CompetitorsProcessorAgent {
  private static readonly SYSTEM_PROMPT = `You are an expert data processor specializing in extracting structured competitor information from research reports. Your role is to:

1. Parse research reports to identify individual competitors
2. Extract structured data for each competitor
3. Validate and clean the extracted data
4. Provide structured output for database storage

You should focus on extracting accurate, complete competitor information including:
- Company name and description
- Founding year and company history
- Employee count and company size
- Funding and revenue information
- Technology stack and key features
- Website and LinkedIn URLs
- Competitive positioning and advantages

Always provide clean, structured data that can be directly stored in a database.`;

  private static readonly EXTRACTION_PROMPT = `Extract structured competitor information from this research report:

RESEARCH REPORT:
{researchReport}

TASK: Extract all individual competitors mentioned in this report and provide structured data for each one.

For each competitor found, extract:
1. Company name (competitor_name)
2. Description of the company and their business
3. Founding year (founded_year) - extract as number
4. Employee count (employee_count) - extract as number
5. Funding raised (funding_raised) - extract as number in USD
6. Revenue (revenue) - extract as number in USD
7. Website URL (website_url)
8. LinkedIn URL (linkedin_url)
9. Key features and capabilities (main_features)
10. Similarity score (similarity_score) - estimate 0-1 based on how similar they are to the startup

Provide the output as a JSON array of competitor objects with the exact field names specified above. Only include competitors that have sufficient information to be useful.`;

  static async processCompetitors(request: CompetitorsProcessorRequest): Promise<CompetitorsProcessorResponse> {
    const prompt = this.EXTRACTION_PROMPT.replace('{researchReport}', request.researchReport);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      const competitors = parsedResponse.competitors || [];

      // Process and validate each competitor
      const processedCompetitors: Competitor[] = [];
      const errors: string[] = [];

      for (const competitor of competitors) {
        try {
          const processedCompetitor = this.validateAndProcessCompetitor(competitor, request.startupId);
          if (processedCompetitor) {
            processedCompetitors.push(processedCompetitor);
          }
        } catch (error) {
          errors.push(`Error processing competitor ${competitor.competitor_name || 'Unknown'}: ${error}`);
        }
      }

      return {
        competitors: processedCompetitors,
        processedCount: processedCompetitors.length,
        updatedCount: 0, // Will be updated by the database operation
        errors
      };

    } catch (error) {
      console.error('Error processing competitors:', error);
      
      // Fallback: try to extract competitors using regex patterns
      const fallbackCompetitors = this.extractCompetitorsFromText(request.researchReport, request.startupId);
      
      return {
        competitors: fallbackCompetitors,
        processedCount: fallbackCompetitors.length,
        updatedCount: 0,
        errors: [`Processing error: ${error}`, 'Used fallback extraction method']
      };
    }
  }

  private static validateAndProcessCompetitor(competitor: any, startupId: string): Competitor | null {
    // Validate required fields
    if (!competitor.competitor_name || !competitor.description) {
      return null;
    }

    // Clean and validate data
    const cleanCompetitor: Competitor = {
      id: Math.random().toString(36).substr(2, 9),
      competitor_name: competitor.competitor_name.trim(),
      description: competitor.description.trim(),
      founded_year: this.parseNumber(competitor.founded_year) || 0,
      employee_count: this.parseNumber(competitor.employee_count) || 0,
      funding_raised: this.parseNumber(competitor.funding_raised) || 0,
      revenue: this.parseNumber(competitor.revenue) || 0,
      linkedin_url: this.cleanUrl(competitor.linkedin_url) || '',
      website_url: this.cleanUrl(competitor.website_url) || '',
      main_features: typeof competitor.main_features === 'string' ? competitor.main_features.trim() : '',
      similarity_score: this.parseSimilarityScore(competitor.similarity_score),
      is_external: true,
      research_status: 'completed'
    };

    return cleanCompetitor;
  }

  private static parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private static parseSimilarityScore(value: any): number {
    const score = this.parseNumber(value);
    if (score === null) {
      return 0.8; // Default similarity score
    }
    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  }

  private static cleanUrl(url: any): string {
    if (!url || typeof url !== 'string') {
      return '';
    }
    
    const cleaned = url.trim();
    if (cleaned && !cleaned.startsWith('http')) {
      return `https://${cleaned}`;
    }
    
    return cleaned;
  }

  private static extractCompetitorsFromText(text: string, startupId: string): Competitor[] {
    const competitors: Competitor[] = [];
    
    // Simple regex-based extraction as fallback
    const competitorPatterns = [
      /COMPETITOR\s+[A-Z]\s*[-–]\s*([^:\n]+)/gi,
      /Company:\s*([^:\n]+)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[-–]\s*(Market Leader|Emerging Player|Technology Competitor)/gi
    ];

    for (const pattern of competitorPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const competitorName = match[1]?.trim();
        if (competitorName && competitorName.length > 2) {
          const competitor: Competitor = {
            id: Math.random().toString(36).substr(2, 9),
            competitor_name: competitorName,
            description: `Competitor identified in research report`,
            founded_year: 0,
            employee_count: 0,
            funding_raised: 0,
            revenue: 0,
            linkedin_url: '',
            website_url: '',
            main_features: '',
            similarity_score: 0.8,
            is_external: true,
            research_status: 'completed'
          };
          
          // Avoid duplicates
          if (!competitors.some(c => c.competitor_name.toLowerCase() === competitorName.toLowerCase())) {
            competitors.push(competitor);
          }
        }
      }
    }

    return competitors;
  }

  static async saveCompetitorsToDatabase(startupId: string, competitors: Competitor[]): Promise<{ updated: number, inserted: number, errors: string[] }> {
    const { getDatabase } = require('../lib/database');
    const db = getDatabase();
    
    let updated = 0;
    let inserted = 0;
    const errors: string[] = [];

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
          updated++;
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
          inserted++;
        }
      } catch (error) {
        errors.push(`Error saving competitor ${competitor.competitor_name}: ${error}`);
      }
    }

    return { updated, inserted, errors };
  }
} 