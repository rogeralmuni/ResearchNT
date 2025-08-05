import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import DocumentUploader from '../../components/DocumentUploader';
import CompetitorsTab from '../../components/CompetitorsTab';
import MarketAnalysisTab from '../../components/MarketAnalysisTab';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

interface Metrics {
  id?: string;
  arr?: number;
  mrr?: number;
  cac?: number;
  ltv?: number;
  churn?: number;
  runway?: number;
  burn_rate?: number;
  customer_count?: number;
  revenue_growth?: number;
}

interface StartupInfo {
  id?: string;
  name?: string;
  sector?: string;
  stage?: string;
  country?: string;
  description?: string;
  website?: string;
  status?: string;
  executive_summary?: string;
  team_info?: string;
  pros?: string;
  cons?: string;
  pending_points?: string;
  memo?: string;
  summary?: string;
  pending_tasks?: string; // Nuevo campo para tareas pendientes
}

export default function StartupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState<'info' | 'docs' | 'metrics' | 'memo' | 'agent' | 'competitors' | 'market'>('info');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [refreshDocs, setRefreshDocs] = useState(0);
  
  // Metrics state
  const [metrics, setMetrics] = useState<Metrics>({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

  // Startup info state
  const [startupInfo, setStartupInfo] = useState<StartupInfo>({});
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Agent state
  const [agentMessages, setAgentMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);

  useEffect(() => {
    if (tab === 'docs' && id) {
      setLoadingDocs(true);
      setErrorDocs(null);
      
      fetch(`/api/documents?startupId=${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setErrorDocs(data.error);
          } else {
            setDocuments(data.documents || []);
          }
          setLoadingDocs(false);
        })
        .catch(error => {
          setErrorDocs('Error loading documents');
          setLoadingDocs(false);
        });
    }
  }, [tab, id, refreshDocs]);

  useEffect(() => {
    if (tab === 'metrics' && id) {
      setLoadingMetrics(true);
      setErrorMetrics(null);
      
      fetch(`/api/metrics?startupId=${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setErrorMetrics(data.error);
          } else {
            setMetrics(data.metrics || {});
          }
          setLoadingMetrics(false);
        })
        .catch(error => {
          setErrorMetrics('Error loading metrics');
          setLoadingMetrics(false);
        });
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === 'info' && id) {
      setLoadingInfo(true);
      setErrorInfo(null);
      
      fetch(`/api/startup/${id}`)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setErrorInfo(data.error);
          } else {
            setStartupInfo(data || {});
            setSummary(data?.summary || '');
          }
          setLoadingInfo(false);
        })
        .catch(error => {
          setErrorInfo('Error loading startup info');
          setLoadingInfo(false);
        });
    }
  }, [tab, id]);

  const handleMetricChange = (field: keyof Metrics, value: string) => {
    setMetrics(prev => ({ ...prev, [field]: value === '' ? undefined : parseFloat(value) }));
  };

  const handleInfoChange = (field: keyof StartupInfo, value: string) => {
    setStartupInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateSummary = async () => {
    if (!id) return;
    
    setGeneratingSummary(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setStartupInfo(prev => ({ ...prev, summary: data.summary }));
      } else {
        console.error('Error generating summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const saveMetrics = async () => {
    if (!id) return;
    
    setSavingMetrics(true);
    setErrorMetrics(null);
    
    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startupId: id,
          ...metrics
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        setErrorMetrics(data.error);
      } else {
        // Success
      }
    } catch (err) {
      setErrorMetrics('Error saving metrics');
    } finally {
      setSavingMetrics(false);
    }
  };

  const saveInfo = async () => {
    if (!id) return;
    
    setSavingInfo(true);
    setErrorInfo(null);
    
    try {
      const response = await fetch(`/api/startup/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startupInfo),
      });
      
      const data = await response.json();
      if (data.error) {
        setErrorInfo(data.error);
      } else {
        // Success
      }
    } catch (err) {
      setErrorInfo('Error saving startup info');
    } finally {
      setSavingInfo(false);
    }
  };

  const addAgentMessage = (text: string, isUser: boolean) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setAgentMessages(prev => [...prev, newMessage]);
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || agentLoading) return;

    const userQuestion = agentInput.trim();
    setAgentInput('');
    addAgentMessage(userQuestion, true);
    setAgentLoading(true);

    try {
      // Simple agent response system
      const response = generateAgentResponse(userQuestion);
      addAgentMessage(response, false);
    } catch (error) {
      addAgentMessage('Lo siento, hubo un error procesando tu pregunta. Inténtalo de nuevo.', false);
    } finally {
      setAgentLoading(false);
    }
  };

  const generateAgentResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('mercado') || lowerQuestion.includes('market')) {
      return 'Para analizar el mercado, necesitaría más información sobre el sector y la competencia. ¿Podrías proporcionar más detalles sobre el mercado objetivo?';
    }
    
    if (lowerQuestion.includes('competidor') || lowerQuestion.includes('competition')) {
      return 'Para identificar competidores, necesitaría información sobre el producto/servicio específico. ¿Puedes describir qué hace exactamente la startup?';
    }
    
    if (lowerQuestion.includes('resumir') || lowerQuestion.includes('documento')) {
      return 'Para resumir documentos, primero necesitas subir los archivos en la pestaña "Documentos". Una vez subidos, puedo ayudarte a analizarlos.';
    }
    
    if (lowerQuestion.includes('memo') || lowerQuestion.includes('actualizar')) {
      return 'Para actualizar la memo, necesito que me proporciones información específica sobre la startup. ¿Qué aspecto quieres que actualice?';
    }
    
    return 'Entiendo tu pregunta. Como agente de investigación, puedo ayudarte con análisis de mercado, competidores, resumen de documentos y actualización de la memo. ¿En qué puedo ayudarte específicamente?';
  };

  if (!id) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{startupInfo.name || 'Startup Details'}</h1>
        <p className="text-gray-600">ID: {id}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información
          </button>
          <button
            onClick={() => setTab('docs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'docs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setTab('memo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'memo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Memo
          </button>
          <button
            onClick={() => setTab('agent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'agent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agente IA
          </button>
          <button
            onClick={() => setTab('competitors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'competitors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Competidores
          </button>
          <button
            onClick={() => setTab('market')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'market'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Análisis de Mercado
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="space-y-6">
          {/* Auto-generated Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resumen Ejecutivo</h2>
              <button
                onClick={generateSummary}
                disabled={generatingSummary}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {generatingSummary ? 'Generando...' : 'Regenerar Resumen'}
              </button>
            </div>
            
            {loadingInfo ? (
              <p>Cargando resumen...</p>
            ) : summary ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">{summary}</pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay resumen generado aún</p>
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {generatingSummary ? 'Generando...' : 'Generar Resumen'}
                </button>
              </div>
            )}
          </div>

          {/* Pending Tasks and Documents */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Documentos, Tareas Pendientes y Puntos por Clarificar</h2>
            <textarea
              value={startupInfo.pending_tasks || ''}
              onChange={(e) => handleInfoChange('pending_tasks', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded h-64"
              placeholder="Documentos pendientes, tareas por completar, puntos que necesitan clarificación, dudas sobre la startup, información adicional requerida, etc."
            />
            <div className="mt-4">
              <button
                onClick={saveInfo}
                disabled={savingInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingInfo ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Documentos</h2>
          
          {/* Document Upload */}
          <DocumentUploader 
            startupId={id as string}
            onUploadComplete={() => setRefreshDocs(prev => prev + 1)}
          />
          
          {/* Documents List */}
          {loadingDocs && <p>Cargando documentos...</p>}
          {errorDocs && <p className="text-red-600">Error: {errorDocs}</p>}
          {!loadingDocs && documents.length === 0 && (
            <p className="text-gray-500">No hay documentos subidos.</p>
          )}
          {!loadingDocs && documents.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Documentos subidos:</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">Tipo: {doc.type}</p>
                      <p className="text-sm text-gray-500">
                        Subido: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Ver
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'metrics' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Métricas Financieras</h2>
          
          {loadingMetrics && <p>Cargando métricas...</p>}
          {errorMetrics && <p className="text-red-600">Error: {errorMetrics}</p>}
          
          {!loadingMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ARR (Annual Recurring Revenue)
                </label>
                <input
                  type="number"
                  value={metrics.arr || ''}
                  onChange={(e) => handleMetricChange('arr', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRR (Monthly Recurring Revenue)
                </label>
                <input
                  type="number"
                  value={metrics.mrr || ''}
                  onChange={(e) => handleMetricChange('mrr', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CAC (Customer Acquisition Cost)
                </label>
                <input
                  type="number"
                  value={metrics.cac || ''}
                  onChange={(e) => handleMetricChange('cac', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LTV (Lifetime Value)
                </label>
                <input
                  type="number"
                  value={metrics.ltv || ''}
                  onChange={(e) => handleMetricChange('ltv', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Churn Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={metrics.churn || ''}
                  onChange={(e) => handleMetricChange('churn', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Runway (meses)
                </label>
                <input
                  type="number"
                  value={metrics.runway || ''}
                  onChange={(e) => handleMetricChange('runway', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="0"
                />
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={saveMetrics}
              disabled={savingMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {savingMetrics ? 'Guardando...' : 'Guardar Métricas'}
            </button>
          </div>
        </div>
      )}

      {tab === 'memo' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Memo de Inversión</h2>
          
          <div className="mb-4">
            <textarea
              value={startupInfo.memo || ''}
              onChange={(e) => handleInfoChange('memo', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded h-96"
              placeholder="Memo completo de inversión sobre la compañía..."
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={saveInfo}
              disabled={savingInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {savingInfo ? 'Guardando...' : 'Guardar Memo'}
            </button>
            <button
              onClick={() => {
                // Generate memo based on available information
                const memo = generateMemoFromInfo(startupInfo, metrics);
                handleInfoChange('memo', memo);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Generar Memo
            </button>
          </div>
        </div>
      )}

      {tab === 'agent' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Agente IA de Investigación</h2>
          
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <strong>Agente IA:</strong> Te ayudo con investigación de mercado, competidores, resumen de documentos y actualización de la memo.
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 border rounded-lg shadow-sm h-96 flex flex-col">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {agentMessages.length === 0 && (
                  <div className="text-center text-gray-500">
                    <p className="mb-4">Haz una pregunta al agente de investigación</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setAgentInput('Analiza el mercado de esta startup');
                          handleAgentSubmit(new Event('submit') as any);
                        }}
                        className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Analiza el mercado de esta startup
                      </button>
                      <button
                        onClick={() => {
                          setAgentInput('Identifica competidores principales');
                          handleAgentSubmit(new Event('submit') as any);
                        }}
                        className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Identifica competidores principales
                      </button>
                      <button
                        onClick={() => {
                          setAgentInput('Resume los documentos subidos');
                          handleAgentSubmit(new Event('submit') as any);
                        }}
                        className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Resume los documentos subidos
                      </button>
                      <button
                        onClick={() => {
                          setAgentInput('Actualiza la memo con nueva información');
                          handleAgentSubmit(new Event('submit') as any);
                        }}
                        className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Actualiza la memo con nueva información
                      </button>
                    </div>
                  </div>
                )}
                
                {agentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                
                {agentLoading && (
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
                <form onSubmit={handleAgentSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    placeholder="Haz una pregunta al agente..."
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={agentLoading}
                  />
                  <button
                    type="submit"
                    disabled={agentLoading || !agentInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'competitors' && (
        <CompetitorsTab startupId={id as string} />
      )}

      {tab === 'market' && (
        <MarketAnalysisTab startupId={id as string} />
      )}
    </div>
  );
}

function generateMemoFromInfo(startupInfo: StartupInfo, metrics: Metrics): string {
  let memo = `# Memo de Inversión: ${startupInfo.name || 'Startup'}\n\n`;
  
  if (startupInfo.executive_summary) {
    memo += `## Resumen Ejecutivo\n${startupInfo.executive_summary}\n\n`;
  }
  
  if (startupInfo.team_info) {
    memo += `## Equipo\n${startupInfo.team_info}\n\n`;
  }
  
  if (metrics.arr || metrics.mrr || metrics.cac || metrics.ltv) {
    memo += `## Métricas Financieras\n`;
    if (metrics.arr) memo += `- ARR: $${metrics.arr.toLocaleString()}\n`;
    if (metrics.mrr) memo += `- MRR: $${metrics.mrr.toLocaleString()}\n`;
    if (metrics.cac) memo += `- CAC: $${metrics.cac.toLocaleString()}\n`;
    if (metrics.ltv) memo += `- LTV: $${metrics.ltv.toLocaleString()}\n`;
    if (metrics.churn) memo += `- Churn: ${metrics.churn}%\n`;
    if (metrics.runway) memo += `- Runway: ${metrics.runway} meses\n`;
    memo += '\n';
  }
  
  if (startupInfo.pros) {
    memo += `## Pros\n${startupInfo.pros}\n\n`;
  }
  
  if (startupInfo.cons) {
    memo += `## Contras\n${startupInfo.cons}\n\n`;
  }
  
  if (startupInfo.pending_points) {
    memo += `## Puntos Pendientes\n${startupInfo.pending_points}\n\n`;
  }
  
  memo += `## Recomendación\n[Pendiente de completar con análisis adicional]`;
  
  return memo;
} 