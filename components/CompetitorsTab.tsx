import { useState, useEffect } from 'react';

interface Competitor {
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

interface CompetitorsResearch {
  startup_id: string;
  research_report: string;
  research_status: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  message_text: string;
  is_user: boolean;
  timestamp: string;
}

interface CompetitorsTabProps {
  startupId: string;
}

export default function CompetitorsTab({ startupId }: CompetitorsTabProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorsResearch, setCompetitorsResearch] = useState<CompetitorsResearch | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    loadCompetitors();
    loadChatMessages();
    loadCompetitorsResearch();
  }, [startupId]);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/competitors?startupId=${startupId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitors(data);
      }
    } catch (error) {
      console.error('Error loading competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitorsResearch = async () => {
    setResearchLoading(true);
    try {
      const response = await fetch(`/api/competitors-research?startupId=${startupId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitorsResearch(data);
      }
    } catch (error) {
      console.error('Error loading competitors research:', error);
    } finally {
      setResearchLoading(false);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await fetch(`/api/chat-messages?startupId=${startupId}&tabType=competitors`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const researchCompetitors = async () => {
    setResearching(true);
    setIsStreaming(true);
    setStreamingContent('');
    
    try {
      const response = await fetch('/api/agents/competitors-research?stream=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId }),
      });
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse Server-Sent Events
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'content' && data.text) {
                  setStreamingContent(prev => prev + data.text);
                } else if (data.type === 'search' && data.query) {
                  setStreamingContent(prev => prev + `\n\n--- SEARCHING FOR: ${data.query} ---\n`);
                } else if (data.type === 'agent_updated' && data.agent) {
                  setStreamingContent(prev => prev + `\n\n--- SWITCHED TO AGENT: ${data.agent} ---\n`);
                } else if (data.type === 'final_output' && data.text) {
                  setStreamingContent(prev => prev + `\n\n--- RESEARCH COMPLETED ---\n`);
                } else if (data.type === 'error' && data.message) {
                  setStreamingContent(prev => prev + `\n\n--- ERROR: ${data.message} ---\n`);
                }
              } catch (e) {
                // If not JSON, treat as plain text
                setStreamingContent(prev => prev + line);
              }
            }
          }
        }
        
        // After streaming is complete, reload data
        await loadCompetitors();
        await loadCompetitorsResearch();
      }
    } catch (error) {
      console.error('Error researching competitors:', error);
      setStreamingContent(prev => prev + `\n\n--- ERROR: ${error} ---\n`);
    } finally {
      setResearching(false);
      setIsStreaming(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const message = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    try {
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        message_text: message,
        is_user: true,
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Send message to API
      const response = await fetch('/api/chat-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          tabType: 'competitors',
          message: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Competitors Analysis</h2>
          <p className="text-sm text-gray-600">Research and analyze competitors for this startup</p>
        </div>
        <button
          onClick={researchCompetitors}
          disabled={researching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {researching ? 'Researching...' : 'Research Competitors'}
        </button>
      </div>

      {/* Streaming Content */}
      {isStreaming && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Research in Progress</h3>
            <p className="text-sm text-gray-600">Live research output</p>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {streamingContent || 'Starting research...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Competitors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Identified Competitors</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-gray-600">Loading competitors...</span>
            </div>
          </div>
        ) : competitors.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No competitors identified yet. Click "Research Competitors" to start analysis.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{competitor.competitor_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{competitor.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Founded</p>
                        <p className="text-sm text-gray-900">{competitor.founded_year || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employees</p>
                        <p className="text-sm text-gray-900">{competitor.employee_count ? formatNumber(competitor.employee_count) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Funding</p>
                        <p className="text-sm text-gray-900">{competitor.funding_raised ? formatCurrency(competitor.funding_raised) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Revenue</p>
                        <p className="text-sm text-gray-900">{competitor.revenue ? formatCurrency(competitor.revenue) : 'N/A'}</p>
                      </div>
                    </div>

                    {competitor.main_features && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Key Features</p>
                        <p className="text-sm text-gray-900 mt-1">{competitor.main_features}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Similarity: {(competitor.similarity_score * 100).toFixed(1)}%
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        competitor.research_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : competitor.research_status === 'researching'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {competitor.research_status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {competitor.website_url && (
                      <a
                        href={competitor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Website
                      </a>
                    )}
                    {competitor.linkedin_url && (
                      <a
                        href={competitor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Competitor Research Report */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Competitive Research Report</h3>
          <p className="text-sm text-gray-600">Detailed research analysis and insights</p>
        </div>
        
        {researchLoading ? (
          <div className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-gray-600">Loading research report...</span>
            </div>
          </div>
        ) : !competitorsResearch ? (
          <div className="p-6 text-center text-gray-500">
            <p>No research report available yet. Click "Research Competitors" to generate a comprehensive analysis.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  competitorsResearch.research_status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : competitorsResearch.research_status === 'researching'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {competitorsResearch.research_status}
                </span>
                {competitorsResearch.updated_at && (
                  <span className="text-xs text-gray-500">
                    Last updated: {formatDate(competitorsResearch.updated_at)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {competitorsResearch.research_report}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
          <p className="text-sm text-gray-600">Ask questions about competitors and get insights</p>
        </div>
        
        <div className="bg-gray-50 border rounded-lg shadow-sm h-96 flex flex-col">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500">
                <p className="mb-4">Ask me about competitors, market analysis, or competitive positioning</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setChatInput('Who are the main competitors?');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Who are the main competitors?
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('What are the key differentiators?');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    What are the key differentiators?
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('How do we compare on pricing?');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    How do we compare on pricing?
                  </button>
                </div>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.is_user
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.message_text}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input form */}
          <div className="border-t p-4">
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about competitors..."
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 