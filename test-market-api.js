const fetch = require('node-fetch');

async function testMarketAPI() {
  console.log('🧪 Testing Market Research API...');
  
  const testData = {
    startupId: '1'
  };

  try {
    console.log('📊 Sending market research request...');
    
    const response = await fetch('http://localhost:3000/api/agents/market', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Market research completed successfully!');
      console.log('\n📋 Research Report Preview:');
      console.log('─'.repeat(50));
      console.log(data.research_report.substring(0, 500) + '...');
      console.log('─'.repeat(50));
      console.log(`\n📊 Analysis Status: ${data.analysis.research_status}`);
    } else {
      const error = await response.text();
      console.error('❌ API Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error in market research API:', error);
  }
}

testMarketAPI(); 