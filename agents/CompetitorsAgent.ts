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

export interface CompetitorsAnalysisRequest {
  startupId: string;
  startupName: string;
  startupDescription: string;
  startupSector: string;
  action: 'research' | 'analyze' | 'compare';
  existingCompetitors?: Competitor[];
}

export interface CompetitorsAnalysisResponse {
  competitors: Competitor[];
  analysis: string;
  recommendations: string[];
  marketPositioning: string;
}

export interface SaveCompetitorRequest {
  startupId: string;
  competitor: Competitor;
}

export class CompetitorsAgent {
  private static readonly SYSTEM_PROMPT = `You are an expert competitive intelligence analyst specializing in startup ecosystems. Your role is to conduct comprehensive competitive analysis using OpenAI's deep research capabilities to identify and analyze competitors for startups.

You have access to web search capabilities to gather current competitor information, company data, and market positioning. Use these capabilities to:

1. Search for direct and indirect competitors
2. Find current company information and metrics
3. Research competitor positioning and strategies
4. Gather funding and revenue data
5. Identify technology stacks and features
6. Analyze market share and competitive landscape
7. Research company history and founding information

When using web search:
- Search for specific competitor companies and their details
- Look for recent company information and updates
- Verify information from multiple sources
- Focus on quantitative data and metrics
- Include source citations when possible

Always provide actionable insights and comprehensive competitor analysis.`;

  private static readonly RESEARCH_PROMPT = `Conduct comprehensive competitive research for this startup using deep research capabilities:

STARTUP INFORMATION:
- Name: {startupName}
- Sector: {startupSector}
- Description: {startupDescription}

RESEARCH REQUIREMENTS:
Please conduct thorough competitive research covering:

1. DIRECT COMPETITORS
   - Search for companies offering similar products/services
   - Find current market leaders in this space
   - Research emerging competitors and startups
   - Identify companies with similar target markets

2. INDIRECT COMPETITORS
   - Search for companies offering alternative solutions
   - Find companies in adjacent markets
   - Research potential future competitors
   - Identify companies that could pivot into this space

3. COMPETITOR ANALYSIS
   - Research company founding dates and history
   - Find current employee counts and company size
   - Search for funding and revenue information
   - Research technology stacks and features
   - Analyze market positioning and strategies

4. COMPETITIVE LANDSCAPE
   - Search for market share data and analysis
   - Find competitive positioning reports
   - Research pricing strategies and models
   - Identify key differentiators and advantages

5. STRATEGIC INSIGHTS
   - Analyze competitive threats and opportunities
   - Research market gaps and underserved segments
   - Find partnership and acquisition opportunities
   - Identify competitive advantages and weaknesses

Use web search to find the most current and relevant competitor information. Include specific data points, company details, and actionable competitive insights. For each competitor found, provide structured data including company name, description, founding year, employee count, funding, revenue, website, and key features.`;

  private static readonly ANALYZE_PROMPT = `Perform a detailed competitive analysis for this startup using deep research:

STARTUP: {startupName}
SECTOR: {startupSector}

EXISTING COMPETITORS:
{competitorsList}

ANALYSIS REQUIREMENTS:
1. Competitive positioning map and analysis
2. Strengths and weaknesses of each competitor
3. Market gaps and opportunities for differentiation
4. Pricing strategy analysis and comparison
5. Technology stack comparison and advantages
6. Customer segment overlap and targeting
7. Go-to-market strategy differences
8. Competitive threat assessment

Use web search to gather current information about existing competitors and find any missing competitors in the market. Provide strategic recommendations for competitive advantage.`;

  private static readonly COMPARE_PROMPT = `Compare this startup against its competitors using deep research:

STARTUP: {startupName}
DESCRIPTION: {startupDescription}

COMPETITORS:
{competitorsList}

COMPARISON CRITERIA:
1. Product/Service Features and capabilities
2. Market Positioning and brand perception
3. Technology Stack and technical advantages
4. Business Model and revenue streams
5. Customer Segments and target markets
6. Pricing Strategy and value proposition
7. Team & Experience and leadership
8. Funding & Resources and financial strength

Use web search to gather current information about competitors and provide a detailed comparison matrix with strategic insights.`;

  static async researchCompetitors(request: CompetitorsAnalysisRequest): Promise<CompetitorsAnalysisResponse> {
    const prompt = this.RESEARCH_PROMPT
      .replace('{startupName}', request.startupName)
      .replace('{startupSector}', request.startupSector)
      .replace('{startupDescription}', request.startupDescription);

    try {
      // Use OpenAI's deep research functionality with proper tool configuration
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web for current competitor information, company data, and market positioning',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query to find relevant competitor information'
                  }
                },
                required: ['query']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'save_competitor',
              description: 'Save competitor information to the database, updating existing records if found',
              parameters: {
                type: 'object',
                properties: {
                  startupId: {
                    type: 'string',
                    description: 'The ID of the startup this competitor is being analyzed for'
                  },
                  competitor: {
                    type: 'object',
                    description: 'Competitor information to save',
                    properties: {
                      competitor_name: {
                        type: 'string',
                        description: 'Name of the competitor company'
                      },
                      description: {
                        type: 'string',
                        description: 'Description of the competitor and their business'
                      },
                      founded_year: {
                        type: 'number',
                        description: 'Year the competitor was founded'
                      },
                      employee_count: {
                        type: 'number',
                        description: 'Number of employees at the competitor'
                      },
                      funding_raised: {
                        type: 'number',
                        description: 'Total funding raised by the competitor in USD'
                      },
                      revenue: {
                        type: 'number',
                        description: 'Annual revenue of the competitor in USD'
                      },
                      linkedin_url: {
                        type: 'string',
                        description: 'LinkedIn URL of the competitor company'
                      },
                      website_url: {
                        type: 'string',
                        description: 'Website URL of the competitor company'
                      },
                      main_features: {
                        type: 'string',
                        description: 'Key features and capabilities of the competitor'
                      },
                      similarity_score: {
                        type: 'number',
                        description: 'Similarity score between the startup and this competitor (0-1)'
                      }
                    },
                    required: ['competitor_name', 'description']
                  }
                },
                required: ['startupId', 'competitor']
              }
            }
          }
        ],
        tool_choice: 'auto'
      });

      // Handle the response with tool calls
      let analysis = '';
      const response = completion.choices[0]?.message;
      
      if (response?.content) {
        analysis += response.content;
      }

      // Process tool calls if any
      if (response?.tool_calls) {
        for (const toolCall of response.tool_calls) {
          if (toolCall.type === 'function') {
            if (toolCall.function?.name === 'web_search') {
              // Handle web search function calls
              const args = JSON.parse(toolCall.function.arguments || '{}');
              const query = args.query;
              
              if (query) {
                analysis += `\n\n--- SEARCHING FOR: ${query} ---\n`;
                analysis += 'Note: Web search results would be integrated here in a production environment.\n';
              }
            } else if (toolCall.function?.name === 'save_competitor') {
              // Handle save competitor function calls
              const args = JSON.parse(toolCall.function.arguments || '{}');
              analysis += `\n\n--- SAVING COMPETITOR: ${args.competitor?.competitor_name} ---\n`;
              analysis += 'Note: Competitor would be saved to database in production environment.\n';
            }
          }
        }
      }

      // If no content was generated, use fallback
      if (!analysis.trim()) {
        analysis = this.generateComprehensiveFallbackAnalysis(request);
      }

      // Parse competitors from the analysis
      const competitors = this.parseCompetitorsFromResponse(analysis);
      const recommendations = this.extractRecommendationsFromResponse(analysis);
      const marketPositioning = this.extractMarketPositioningFromResponse(analysis);

      return {
        competitors,
        analysis,
        recommendations,
        marketPositioning
      };

    } catch (error) {
      console.error('Error in competitive research:', error);
      
      // Enhanced fallback response with comprehensive competitive analysis
      const fallbackAnalysis = this.generateComprehensiveFallbackAnalysis(request);
      
      const competitors = this.parseCompetitorsFromResponse(fallbackAnalysis);
      const recommendations = this.extractRecommendationsFromResponse(fallbackAnalysis);
      const marketPositioning = this.extractMarketPositioningFromResponse(fallbackAnalysis);

      return {
        competitors,
        analysis: fallbackAnalysis,
        recommendations,
        marketPositioning
      };
    }
  }

  static async analyzeCompetitors(request: CompetitorsAnalysisRequest): Promise<CompetitorsAnalysisResponse> {
    const competitorsList = request.existingCompetitors?.map(c => 
      `- ${c.competitor_name}: ${c.description}`
    ).join('\n') || 'No competitors found';

    const prompt = this.ANALYZE_PROMPT
      .replace('{startupName}', request.startupName)
      .replace('{startupSector}', request.startupSector)
      .replace('{competitorsList}', competitorsList);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web for current competitor information and market analysis',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query to find relevant competitor information'
                  }
                },
                required: ['query']
              }
            }
          }
        ],
        tool_choice: 'auto'
      });

      const response = completion.choices[0]?.message?.content;
      
      return {
        competitors: request.existingCompetitors || [],
        analysis: response || '',
        recommendations: this.extractRecommendationsFromResponse(response || ''),
        marketPositioning: this.extractMarketPositioningFromResponse(response || '')
      };

    } catch (error) {
      console.error('Error in competitor analysis:', error);
      
      const fallbackAnalysis = this.generateComprehensiveFallbackAnalysis(request);
      
      return {
        competitors: request.existingCompetitors || [],
        analysis: fallbackAnalysis,
        recommendations: this.extractRecommendationsFromResponse(fallbackAnalysis),
        marketPositioning: this.extractMarketPositioningFromResponse(fallbackAnalysis)
      };
    }
  }

  static async compareWithCompetitors(request: CompetitorsAnalysisRequest): Promise<CompetitorsAnalysisResponse> {
    const competitorsList = request.existingCompetitors?.map(c => 
      `- ${c.competitor_name}: ${c.description}`
    ).join('\n') || 'No competitors found';

    const prompt = this.COMPARE_PROMPT
      .replace('{startupName}', request.startupName)
      .replace('{startupDescription}', request.startupDescription)
      .replace('{competitorsList}', competitorsList);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
        tools: [
          {
            type: 'function',
            function: {
              name: 'web_search',
              description: 'Search the web for current competitor information and comparison data',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query to find relevant competitor comparison information'
                  }
                },
                required: ['query']
              }
            }
          }
        ],
        tool_choice: 'auto'
      });

      const response = completion.choices[0]?.message?.content;
      
      return {
        competitors: request.existingCompetitors || [],
        analysis: response || '',
        recommendations: this.extractRecommendationsFromResponse(response || ''),
        marketPositioning: this.extractMarketPositioningFromResponse(response || '')
      };

    } catch (error) {
      console.error('Error in competitor comparison:', error);
      
      const fallbackAnalysis = this.generateComprehensiveFallbackAnalysis(request);
      
      return {
        competitors: request.existingCompetitors || [],
        analysis: fallbackAnalysis,
        recommendations: this.extractRecommendationsFromResponse(fallbackAnalysis),
        marketPositioning: this.extractMarketPositioningFromResponse(fallbackAnalysis)
      };
    }
  }

  private static generateComprehensiveFallbackAnalysis(request: CompetitorsAnalysisRequest): string {
    const sector = request.startupSector || 'Technology';
    const name = request.startupName;
    const description = request.startupDescription;

    return `Competitive Analysis Report for ${name}

SECTOR: ${sector}
DESCRIPTION: ${description}

COMPETITIVE LANDSCAPE:
Based on the startup's sector and description, this appears to be a ${sector} company. The competitive analysis below provides a comprehensive overview of the competitive landscape and opportunities.

DIRECT COMPETITORS:
- Market Leaders: Established players with strong brand recognition and customer base
- Emerging Players: Innovative startups disrupting traditional markets
- Technology Competitors: Companies with similar technology stacks and capabilities
- Feature Competitors: Companies offering similar features and functionality

INDIRECT COMPETITORS:
- Alternative Solutions: Companies offering different approaches to the same problem
- Adjacent Markets: Companies in related markets that could expand
- Future Competitors: Companies that could pivot into this space
- Legacy Solutions: Traditional companies that could modernize

COMPETITIVE ANALYSIS:
- Market Concentration: Moderate to high depending on sector maturity
- Competitive Advantages: Technology differentiation, customer experience, pricing strategy
- Market Gaps: Opportunities for differentiation and innovation
- Competitive Threats: Large players entering the market with similar solutions

STRATEGIC RECOMMENDATIONS:
1. Focus on specific customer pain points and use cases
2. Build strong partnerships with complementary technology providers
3. Invest in customer success and retention programs
4. Develop a clear competitive differentiation strategy
5. Monitor competitive landscape and emerging threats

Note: This analysis is based on general competitive intelligence and industry knowledge. For more specific and detailed competitive research, consider engaging with competitive intelligence firms or conducting primary research.`;
  }

  private static parseCompetitorsFromResponse(response: string): Competitor[] {
    // This is a simplified parser - in a real implementation, you'd want more robust parsing
    const competitors: Competitor[] = [];
    
    // Extract competitor information from the response
    const lines = response.split('\n');
    let currentCompetitor: Partial<Competitor> = {};
    
    for (const line of lines) {
      if (line.includes('Competitor:') || line.includes('Name:')) {
        if (currentCompetitor.competitor_name) {
          competitors.push(currentCompetitor as Competitor);
        }
        currentCompetitor = {
          id: Math.random().toString(36).substr(2, 9),
          competitor_name: line.split(':')[1]?.trim() || '',
          description: '',
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
      } else if (line.includes('Description:')) {
        currentCompetitor.description = line.split(':')[1]?.trim() || '';
      } else if (line.includes('Website:')) {
        currentCompetitor.website_url = line.split(':')[1]?.trim() || '';
      }
    }
    
    if (currentCompetitor.competitor_name) {
      competitors.push(currentCompetitor as Competitor);
    }
    
    return competitors;
  }

  private static extractAnalysisFromResponse(response: string): string {
    // Extract analysis section from response
    const analysisMatch = response.match(/Analysis:(.*?)(?=Recommendations:|$)/s);
    return analysisMatch ? analysisMatch[1].trim() : response;
  }

  private static extractRecommendationsFromResponse(response: string): string[] {
    // Extract recommendations from response
    const recommendationsMatch = response.match(/Recommendations:(.*?)(?=Market Positioning:|$)/s);
    if (!recommendationsMatch) return [];
    
    const recommendationsText = recommendationsMatch[1].trim();
    return recommendationsText.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private static extractMarketPositioningFromResponse(response: string): string {
    // Extract market positioning from response
    const positioningMatch = response.match(/Market Positioning:(.*?)$/s);
    return positioningMatch ? positioningMatch[1].trim() : '';
  }
} 