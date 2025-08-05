import { openai } from '../lib/openaiClient';

export interface MemoData {
  startupId: string;
  startupName: string;
  startupDescription: string;
  startupSector: string;
  teamInfo?: string;
  metrics?: {
    arr?: number;
    mrr?: number;
    cac?: number;
    ltv?: number;
    churn?: number;
    runway?: number;
  };
  competitors?: Array<{
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  marketAnalysis?: {
    researchReport: string;
  };
  documents?: Array<{
    name: string;
    summary: string;
    kpis: string;
    redFlags: string;
  }>;
}

export interface MemoRequest {
  startupId: string;
  startupName: string;
  startupDescription: string;
  startupSector: string;
  action: 'generate' | 'update' | 'enhance';
  memoData: MemoData;
  existingMemo?: string;
}

export interface MemoResponse {
  memo: string;
  executiveSummary: string;
  investmentThesis: {
    pros: string[];
    cons: string[];
    risks: string[];
    opportunities: string[];
  };
  valuation: {
    recommended: number;
    range: { min: number; max: number };
    methodology: string;
  };
  recommendation: 'invest' | 'pass' | 'more-info';
  confidence: number; // 0-100
}

export class MemoAgent {
  private static readonly SYSTEM_PROMPT = `You are an expert investment analyst specializing in startup evaluation and due diligence. Your role is to:

1. Generate comprehensive investment memos
2. Evaluate startup potential and risks
3. Provide investment recommendations
4. Assess valuation and investment terms
5. Identify key investment criteria

You have deep expertise in venture capital, startup metrics, and market analysis. Always provide balanced, data-driven analysis with clear investment recommendations.`;

  private static readonly GENERATE_PROMPT = `Generate a comprehensive investment memo for this startup:

STARTUP INFORMATION:
- Name: {startupName}
- Sector: {startupSector}
- Description: {startupDescription}
- Team: {teamInfo}

FINANCIAL METRICS:
{metrics}

COMPETITIVE LANDSCAPE:
{competitors}

MARKET ANALYSIS:
{marketAnalysis}

DOCUMENTS REVIEWED:
{documents}

MEMO REQUIREMENTS:
1. Executive Summary (2-3 paragraphs)
2. Investment Thesis
   - Key investment rationale
   - Competitive advantages
   - Market opportunity
   - Team assessment

3. Financial Analysis
   - Revenue model analysis
   - Unit economics
   - Growth projections
   - Cash flow analysis

4. Risk Assessment
   - Market risks
   - Competitive risks
   - Execution risks
   - Regulatory risks

5. Valuation Analysis
   - Comparable company analysis
   - DCF considerations
   - Investment terms

6. Investment Recommendation
   - Clear invest/pass decision
   - Confidence level
   - Key conditions

Provide a professional investment memo suitable for VC partners.`;

  private static readonly UPDATE_PROMPT = `Update the existing investment memo with new information:

EXISTING MEMO:
{existingMemo}

NEW INFORMATION:
- Startup: {startupName}
- Sector: {startupSector}
- Updated Metrics: {metrics}
- New Competitors: {competitors}
- Market Updates: {marketAnalysis}
- New Documents: {documents}

Update the memo to reflect new information while maintaining the original structure and analysis quality.`;

  private static readonly ENHANCE_PROMPT = `Enhance the existing investment memo with deeper analysis:

EXISTING MEMO:
{existingMemo}

ENHANCEMENT REQUIREMENTS:
1. Deeper competitive analysis
2. Enhanced market sizing
3. More detailed risk assessment
4. Improved valuation methodology
5. Additional investment scenarios
6. Enhanced due diligence checklist

Provide enhanced analysis while maintaining the original memo structure.`;

  static async generateMemo(request: MemoRequest): Promise<MemoResponse> {
    const metrics = request.memoData.metrics ? 
      `ARR: $${request.memoData.metrics.arr || 0}
       MRR: $${request.memoData.metrics.mrr || 0}
       CAC: $${request.memoData.metrics.cac || 0}
       LTV: $${request.memoData.metrics.ltv || 0}
       Churn: ${request.memoData.metrics.churn || 0}%
       Runway: ${request.memoData.metrics.runway || 0} months` : 
      'No metrics available';

    const competitors = request.memoData.competitors?.map(c => 
      `- ${c.name}: ${c.description}
         Strengths: ${c.strengths.join(', ')}
         Weaknesses: ${c.weaknesses.join(', ')}`
    ).join('\n') || 'No competitors analyzed';

    const marketAnalysis = request.memoData.marketAnalysis ? 
      `Market Research Report: ${request.memoData.marketAnalysis.researchReport}` : 
      'No market analysis available';

    const documents = request.memoData.documents?.map(d => 
      `- ${d.name}
         Summary: ${d.summary}
         KPIs: ${d.kpis}
         Red Flags: ${d.redFlags}`
    ).join('\n') || 'No documents reviewed';

    const prompt = this.GENERATE_PROMPT
      .replace('{startupName}', request.startupName)
      .replace('{startupSector}', request.startupSector)
      .replace('{startupDescription}', request.startupDescription)
      .replace('{teamInfo}', request.memoData.teamInfo || 'No team information available')
      .replace('{metrics}', metrics)
      .replace('{competitors}', competitors)
      .replace('{marketAnalysis}', marketAnalysis)
      .replace('{documents}', documents);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    return this.parseMemoResponse(response || '');
  }

  static async updateMemo(request: MemoRequest): Promise<MemoResponse> {
    const metrics = request.memoData.metrics ? 
      `ARR: $${request.memoData.metrics.arr || 0}, MRR: $${request.memoData.metrics.mrr || 0}, CAC: $${request.memoData.metrics.cac || 0}` : 
      'No metrics available';

    const competitors = request.memoData.competitors?.map(c => c.name).join(', ') || 'No competitors';
    const marketAnalysis = request.memoData.marketAnalysis ? 
      `Market Research Report: ${request.memoData.marketAnalysis.researchReport}` : 
      'No market data';
    const documents = request.memoData.documents?.map(d => d.name).join(', ') || 'No documents';

    const prompt = this.UPDATE_PROMPT
      .replace('{existingMemo}', request.existingMemo || 'No existing memo')
      .replace('{startupName}', request.startupName)
      .replace('{startupSector}', request.startupSector)
      .replace('{metrics}', metrics)
      .replace('{competitors}', competitors)
      .replace('{marketAnalysis}', marketAnalysis)
      .replace('{documents}', documents);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    return this.parseMemoResponse(response || '');
  }

  static async enhanceMemo(request: MemoRequest): Promise<MemoResponse> {
    const prompt = this.ENHANCE_PROMPT
      .replace('{existingMemo}', request.existingMemo || 'No existing memo');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: this.SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    return this.parseMemoResponse(response || '');
  }

  private static parseMemoResponse(response: string): MemoResponse {
    const executiveSummary = this.extractSectionFromResponse(response, 'Executive Summary');
    const pros = this.extractListFromResponse(response, 'Pros');
    const cons = this.extractListFromResponse(response, 'Cons');
    const risks = this.extractListFromResponse(response, 'Risks');
    const opportunities = this.extractListFromResponse(response, 'Opportunities');
    
    const valuation = this.extractValuationFromResponse(response);
    const recommendation = this.extractRecommendationFromResponse(response);
    const confidence = this.extractConfidenceFromResponse(response);

    return {
      memo: response,
      executiveSummary,
      investmentThesis: {
        pros,
        cons,
        risks,
        opportunities
      },
      valuation,
      recommendation,
      confidence
    };
  }

  private static extractSectionFromResponse(response: string, sectionName: string): string {
    const sectionMatch = response.match(new RegExp(`${sectionName}:(.*?)(?=\\n\\n|$)`), 's');
    return sectionMatch ? sectionMatch[1].trim() : '';
  }

  private static extractListFromResponse(response: string, listName: string): string[] {
    const listMatch = response.match(new RegExp(`${listName}:(.*?)(?=\\n\\n|$)`), 's');
    if (!listMatch) return [];
    
    const listText = listMatch[1].trim();
    return listText.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private static extractValuationFromResponse(response: string): { recommended: number; range: { min: number; max: number }; methodology: string } {
    const valuationMatch = response.match(/Valuation:?\s*\$?([0-9,]+)\s*(million|billion)/i);
    const rangeMatch = response.match(/Range:?\s*\$?([0-9,]+)\s*-\s*\$?([0-9,]+)\s*(million|billion)/i);
    const methodologyMatch = response.match(/Methodology:?\s*(.*?)(?=\n|$)/i);

    return {
      recommended: valuationMatch ? parseFloat(valuationMatch[1].replace(/,/g, '')) : 0,
      range: {
        min: rangeMatch ? parseFloat(rangeMatch[1].replace(/,/g, '')) : 0,
        max: rangeMatch ? parseFloat(rangeMatch[2].replace(/,/g, '')) : 0
      },
      methodology: methodologyMatch ? methodologyMatch[1].trim() : 'Comparable company analysis'
    };
  }

  private static extractRecommendationFromResponse(response: string): 'invest' | 'pass' | 'more-info' {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('invest') || lowerResponse.includes('recommend investment')) {
      return 'invest';
    } else if (lowerResponse.includes('pass') || lowerResponse.includes('not recommend')) {
      return 'pass';
    } else {
      return 'more-info';
    }
  }

  private static extractConfidenceFromResponse(response: string): number {
    const confidenceMatch = response.match(/Confidence:?\s*([0-9]+)%/i);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
  }
} 