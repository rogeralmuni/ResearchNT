import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface StartupAnalysisProps {
  startupId: string;
  startup: any;
}

interface Analysis {
  analysis: string;
  startup: any;
  documentsCount: number;
  hasMetrics: boolean;
  notesCount: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AnalysisHistory {
  id: string;
  analysis_type: string;
  content: string;
  trigger: string;
  created_at: string;
}

export default function StartupAnalysis({ startupId, startup }: StartupAnalysisProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketResearch, setMarketResearch] = useState<string | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Generate initial analysis and load history
  useEffect(() => {
    generateAnalysis();
    loadAnalysisHistory();
  }, [startupId]);

  // Auto-update analysis when data changes (if enabled)
  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(() => {
        // Check for new documents, metrics, or notes
        checkForUpdates();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoUpdate, startupId]);

  const generateAnalysis = async (trigger = 'manual') => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        
        // Save to analysis history
        await saveAnalysisHistory('investment', data.analysis, trigger);
      } else {
        console.error('Error generating analysis');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch(`/api/analysis-history?startupId=${startupId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const saveAnalysisHistory = async (analysisType: string, content: string, trigger: string) => {
    try {
      await fetch('/api/analysis-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          analysisType,
          content,
          trigger
        }),
      });
    } catch (error) {
      console.error('Error saving analysis history:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      // Check if there are new documents, metrics, or notes
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('startup_id', startupId);

      const { data: metrics } = await supabase
        .from('metrics')
        .select('id')
        .eq('startup_id', startupId);

      const { data: notes } = await supabase
        .from('notes')
        .select('id')
        .eq('startup_id', startupId);

      // If there are new items, trigger analysis update
      if (documents && documents.length > 0) {
        generateAnalysis('document_upload');
        setNotification('Análisis actualizado automáticamente por nuevos documentos');
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const downloadMemo = async (format: 'pdf' | 'word') => {
    setDownloading(true);
    try {
      const response = await fetch('/api/download-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId, format }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memo-${startup.name}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'txt' : 'docx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error downloading memo');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const generateMarketResearch = async () => {
    setResearchLoading(true);
    try {
      const response = await fetch('/api/research-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          startupName: startup.name,
          sector: startup.sector,
          description: startup.description,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketResearch(data.marketAnalysis);
        
        // Save to analysis history
        await saveAnalysisHistory('market_research', data.marketAnalysis, 'manual');
      } else {
        console.error('Error generating market research');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setResearchLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId,
          message: chatInput,
          conversationHistory: chatMessages,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        
        // Save chat interaction to history
        await saveAnalysisHistory('chat', `User: ${chatInput}\nAssistant: ${data.response}`, 'chat_interaction');
      } else {
        console.error('Error in chat');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    "¿Cuáles son los principales riesgos de esta inversión?",
    "Actualiza el memo de inversión con la información más reciente",
    "¿Qué preguntas críticas deberíamos hacer en due diligence?",
    "Compara esta startup con otras del portfolio",
    "¿Cuál es el tamaño de mercado y competencia?",
  ];

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{notification}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setNotification(null)}
          >
            <span className="sr-only">Cerrar</span>
            <svg className="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Cerrar</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Analysis Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Análisis de Inversión</h2>
          <div className="flex space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-actualizar</span>
            </label>
            <button
              onClick={() => generateAnalysis()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Actualizar Análisis'}
            </button>
            <div className="flex space-x-1">
              <button
                onClick={() => downloadMemo('pdf')}
                disabled={downloading}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {downloading ? 'Descargando...' : 'PDF'}
              </button>
              <button
                onClick={() => downloadMemo('word')}
                disabled={downloading}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {downloading ? 'Descargando...' : 'Word'}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Generando análisis completo...</p>
          </div>
        )}

        {analysis && (
          <div className="prose max-w-none">
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                📊 {analysis.documentsCount} documentos analizados | 
                📈 {analysis.hasMetrics ? 'Métricas disponibles' : 'Sin métricas'} | 
                📝 {analysis.notesCount} notas internas
              </p>
            </div>
            <div className="whitespace-pre-wrap text-gray-800">
              {analysis.analysis}
            </div>
          </div>
        )}

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Historial de Análisis</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analysisHistory.slice(0, 5).map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-blue-600">
                      {entry.analysis_type === 'investment' ? '📊 Análisis de Inversión' :
                       entry.analysis_type === 'market_research' ? '🔍 Research de Mercado' :
                       entry.analysis_type === 'chat' ? '💬 Chat IA' : '📝 Análisis'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Trigger: {entry.trigger === 'manual' ? 'Manual' :
                              entry.trigger === 'document_upload' ? 'Nuevo documento' :
                              entry.trigger === 'metrics_update' ? 'Métricas actualizadas' :
                              entry.trigger === 'note_added' ? 'Nueva nota' :
                              entry.trigger === 'chat_interaction' ? 'Interacción chat' : entry.trigger}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market Research Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Research de Mercado</h2>
          <button
            onClick={generateMarketResearch}
            disabled={researchLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {researchLoading ? 'Investigando...' : 'Generar Research'}
          </button>
        </div>

        {researchLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Analizando mercado y competidores...</p>
          </div>
        )}

        {marketResearch && (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800">
              {marketResearch}
            </div>
          </div>
        )}
      </div>

      {/* Chat Analysis Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Asistente IA de Análisis</h2>
        
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>💬 Inicia una conversación sobre el análisis de {startup.name}</p>
              <p className="text-sm mt-2">Puedes preguntar sobre pros/contras, actualizar memos, research de mercado, etc.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Analizando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Preguntas sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setChatInput(question)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Pregunta sobre el análisis de inversión..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={chatLoading}
          />
          <button
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
} 