// Export all AI agents
export { CompetitorsAgent, type Competitor, type CompetitorsAnalysisRequest, type CompetitorsAnalysisResponse } from './CompetitorsAgent';
export { MarketAgent, type MarketAnalysis, type MarketAnalysisRequest, type MarketAnalysisResponse } from './MarketAgent';
export { MemoAgent, type MemoData, type MemoRequest, type MemoResponse } from './MemoAgent';

// Agent types for easy access
export type AgentType = 'competitors' | 'market' | 'memo';
export type AgentAction = 'research' | 'analyze' | 'compare' | 'generate' | 'update' | 'enhance' | 'forecast';

// Agent factory for creating agent instances
export class AgentFactory {
  static getAgent(type: AgentType) {
    switch (type) {
      case 'competitors':
        return CompetitorsAgent;
      case 'market':
        return MarketAgent;
      case 'memo':
        return MemoAgent;
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
} 