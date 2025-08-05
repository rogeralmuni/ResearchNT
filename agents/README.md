# AI Agents System

This directory contains specialized AI agents for different aspects of startup analysis. Each agent is designed with specific tools, prompts, and capabilities for their respective domains.

## Structure

```
agents/
├── index.ts                 # Main exports and agent factory
├── CompetitorsAgent.ts      # Competitive intelligence analysis
├── MarketAgent.ts          # Market research and analysis
├── MemoAgent.ts            # Investment memo generation
└── README.md               # This documentation
```

## Agents Overview

### 1. CompetitorsAgent
**Purpose**: Analyze competitive landscape and identify competitors

**Actions**:
- `research`: Identify and analyze competitors
- `analyze`: Deep competitive analysis
- `compare`: Compare startup against competitors

**Key Features**:
- Competitor identification and profiling
- Competitive positioning analysis
- Market share estimation
- Strategic recommendations

### 2. MarketAgent
**Purpose**: Conduct market research and analysis

**Actions**:
- `research`: Comprehensive market research
- `analyze`: Detailed market analysis
- `forecast`: Market forecasting and trends

**Key Features**:
- Market size analysis (TAM, SAM, SOM)
- Growth trend analysis
- Target segment identification
- Regulatory environment assessment
- Market opportunity identification

### 3. MemoAgent
**Purpose**: Generate investment memos and recommendations

**Actions**:
- `generate`: Create comprehensive investment memo
- `update`: Update existing memo with new information
- `enhance`: Enhance memo with deeper analysis

**Key Features**:
- Executive summary generation
- Investment thesis development
- Financial analysis
- Risk assessment
- Valuation analysis
- Investment recommendations

## Usage

### Basic Usage
```typescript
import { CompetitorsAgent, MarketAgent, MemoAgent } from '../agents';

// Use competitors agent
const competitorsResponse = await CompetitorsAgent.researchCompetitors({
  startupId: '123',
  startupName: 'TechStart',
  startupDescription: 'AI-powered SaaS platform',
  startupSector: 'SaaS',
  action: 'research'
});

// Use market agent
const marketResponse = await MarketAgent.researchMarket({
  startupId: '123',
  startupName: 'TechStart',
  startupDescription: 'AI-powered SaaS platform',
  startupSector: 'SaaS',
  action: 'research'
});

// Use memo agent
const memoResponse = await MemoAgent.generateMemo({
  startupId: '123',
  startupName: 'TechStart',
  startupDescription: 'AI-powered SaaS platform',
  startupSector: 'SaaS',
  action: 'generate',
  memoData: { /* ... */ }
});
```

### API Endpoints
Each agent has a corresponding API endpoint:

- `/api/agents/competitors` - Competitors analysis
- `/api/agents/market` - Market research
- `/api/agents/memo` - Memo generation

### Example API Call
```javascript
const response = await fetch('/api/agents/competitors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startupId: '123',
    action: 'research'
  })
});
```

## Agent Factory

Use the AgentFactory for dynamic agent selection:

```typescript
import { AgentFactory } from '../agents';

const agent = AgentFactory.getAgent('competitors');
const response = await agent.researchCompetitors(request);
```

## Response Formats

### CompetitorsAgent Response
```typescript
interface CompetitorsAnalysisResponse {
  competitors: Competitor[];
  analysis: string;
  recommendations: string[];
  marketPositioning: string;
}
```

### MarketAgent Response
```typescript
interface MarketAnalysisResponse {
  analysis: MarketAnalysis;
  insights: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  marketSize: {
    current: number;
    projected: number;
    growthRate: number;
  };
}
```

### MemoAgent Response
```typescript
interface MemoResponse {
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
  confidence: number;
}
```

## Database Integration

All agents automatically:
- Save results to the database
- Update existing records when appropriate
- Maintain data consistency across related tables

## Error Handling

All agents include comprehensive error handling:
- Input validation
- Database connection errors
- OpenAI API errors
- Response parsing errors

## Customization

Each agent can be customized by:
- Modifying system prompts
- Adjusting temperature and token limits
- Adding new actions
- Extending response parsing logic

## Best Practices

1. **Always validate inputs** before passing to agents
2. **Handle errors gracefully** in your application
3. **Cache results** when appropriate to avoid repeated API calls
4. **Monitor usage** to manage OpenAI costs
5. **Test thoroughly** with different startup types and scenarios 