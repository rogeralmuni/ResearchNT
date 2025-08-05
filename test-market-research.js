const { MarketAgent } = require('./agents/MarketAgent');

async function testMarketResearch() {
  console.log('🧪 Testing Market Research with OpenAI Deep Research...');
  
  const request = {
    startupId: '1',
    startupName: 'TechFlow Analytics',
    startupDescription: 'A business intelligence platform that provides real-time analytics and AI-powered insights for enterprises.',
    startupSector: 'Business Intelligence & Analytics'
  };

  try {
    console.log('📊 Generating market research report...');
    const response = await MarketAgent.researchMarket(request);
    
    console.log('✅ Market research completed successfully!');
    console.log('\n📋 Research Report Preview:');
    console.log('─'.repeat(50));
    console.log(response.research_report.substring(0, 500) + '...');
    console.log('─'.repeat(50));
    console.log(`\n📊 Analysis Status: ${response.analysis.research_status}`);
    
  } catch (error) {
    console.error('❌ Error in market research:', error);
  }
}

testMarketResearch(); 