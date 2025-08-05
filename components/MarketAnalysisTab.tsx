import { useState, useEffect } from 'react';

interface MarketAnalysis {
  id: string;
  startup_id: string;
  research_report: string;
  research_status: string;
}

interface ChatMessage {
  id: string;
  message_text: string;
  is_user: boolean;
  timestamp: string;
}

interface MarketAnalysisTabProps {
  startupId: string;
}

export default function MarketAnalysisTab({ startupId }: MarketAnalysisTabProps) {
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    loadMarketAnalysis();
    loadChatMessages();
  }, [startupId]);

  const loadMarketAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/market-analysis?startupId=${startupId}`);
      if (response.ok) {
        const data = await response.json();
        setMarketAnalysis(data);
      }
    } catch (error) {
      console.error('Error loading market analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await fetch(`/api/chat-messages?startupId=${startupId}&tabType=market`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const researchMarket = async () => {
    setResearching(true);
    setIsStreaming(true);
    setStreamingContent('');
    
    try {
      const response = await fetch('/api/agents/market?stream=true', {
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
        await loadMarketAnalysis();
      }
    } catch (error) {
      console.error('Error researching market:', error);
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
          tabType: 'market',
          message,
          isUser: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to chat
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          message_text: data.aiResponse,
          is_user: false,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Análisis de Mercado</h2>
            <button
              onClick={researchMarket}
              disabled={researching}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {researching ? 'Analizando...' : 'Generar Reporte de Mercado'}
            </button>
          </div>

          {/* Streaming Content */}
          {isStreaming && (
            <div className="mb-6 border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Investigación en Progreso</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                  {streamingContent || 'Iniciando investigación...'}
                </pre>
              </div>
            </div>
          )}

          {loading ? (
            <p>Cargando análisis de mercado...</p>
          ) : !marketAnalysis ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay análisis de mercado disponible</p>
              <button
                onClick={researchMarket}
                disabled={researching}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {researching ? 'Generando...' : 'Generar Reporte de Mercado'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Research Report */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Reporte de Investigación de Mercado</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {marketAnalysis.research_report}
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Estado: <span className={`font-medium ${marketAnalysis.research_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {marketAnalysis.research_status === 'completed' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Chat con Agente</h3>
        
        <div className="bg-gray-50 border rounded-lg shadow-sm h-96 flex flex-col">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500">
                <p className="mb-4">Haz una pregunta sobre el mercado</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setChatInput('¿Cuál es el tamaño del mercado objetivo?');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    ¿Cuál es el tamaño del mercado objetivo?
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('¿Cuáles son las principales tendencias del mercado?');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    ¿Cuáles son las principales tendencias?
                  </button>
                  <button
                    onClick={() => {
                      setChatInput('Analiza las oportunidades de crecimiento');
                      handleChatSubmit(new Event('submit') as any);
                    }}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Analiza las oportunidades de crecimiento
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
                  className={`max-w-xs px-4 py-2 rounded-lg ${
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
                <div className="bg-gray-200 text-gray-800 max-w-xs px-4 py-2 rounded-lg">
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
                placeholder="Pregunta sobre el mercado..."
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 