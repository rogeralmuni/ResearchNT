import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DocumentUploader from '../../components/DocumentUploader';
import StartupAnalysis from '../../components/StartupAnalysis';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  summary?: string;
  kpis?: string;
  red_flags?: string;
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

interface Note {
  id?: string;
  content: string;
  created_at?: string;
}

export default function StartupPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState<'info' | 'docs' | 'metrics' | 'ia' | 'notes' | 'analysis'>('info');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [refreshDocs, setRefreshDocs] = useState(0);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  
  // Metrics state
  const [metrics, setMetrics] = useState<Metrics>({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [errorNotes, setErrorNotes] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (tab === 'docs' && id) {
      setLoadingDocs(true);
      setErrorDocs(null);
      supabase
        .from('documents')
        .select('id, name, type, url, uploaded_at, summary, kpis, red_flags')
        .eq('startup_id', id)
        .then(({ data, error }: { data: Document[] | null; error: any }) => {
          if (error) setErrorDocs(error.message);
          else setDocuments(data || []);
          setLoadingDocs(false);
        });
    }
  }, [tab, id, refreshDocs]);

  useEffect(() => {
    if (tab === 'metrics' && id) {
      setLoadingMetrics(true);
      setErrorMetrics(null);
      supabase
        .from('metrics')
        .select('*')
        .eq('startup_id', id)
        .single()
        .then(({ data, error }: { data: Metrics | null; error: any }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            setErrorMetrics(error.message);
          } else {
            setMetrics(data || {});
          }
          setLoadingMetrics(false);
        });
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === 'notes' && id) {
      setLoadingNotes(true);
      setErrorNotes(null);
      supabase
        .from('notes')
        .select('*')
        .eq('startup_id', id)
        .order('created_at', { ascending: false })
        .then(({ data, error }: { data: Note[] | null; error: any }) => {
          if (error) setErrorNotes(error.message);
          else setNotes(data || []);
          setLoadingNotes(false);
        });
    }
  }, [tab, id]);

  const toggleDocExpansion = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const handleMetricChange = (field: keyof Metrics, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setMetrics((prev: Metrics) => ({ ...prev, [field]: numValue }));
  };

  const saveMetrics = async () => {
    setSavingMetrics(true);
    setErrorMetrics(null);
    
    try {
      const metricsData = { ...metrics, startup_id: id };
      
      if (metrics.id) {
        // Update existing metrics
        const { error } = await supabase
          .from('metrics')
          .update(metricsData)
          .eq('id', metrics.id);
        if (error) throw error;
      } else {
        // Insert new metrics
        const { data, error } = await supabase
          .from('metrics')
          .insert([metricsData])
          .select()
          .single();
        if (error) throw error;
        setMetrics((prev: Metrics) => ({ ...prev, id: data.id }));
      }
    } catch (error: any) {
      setErrorMetrics(error.message);
    } finally {
      setSavingMetrics(false);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    
    setSavingNote(true);
    setErrorNotes(null);
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          startup_id: id,
          content: newNote.trim(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setNotes((prev: Note[]) => [data, ...prev]);
      setNewNote('');
    } catch (error: any) {
      setErrorNotes(error.message);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      
      setNotes((prev: Note[]) => prev.filter((note: Note) => note.id !== noteId));
    } catch (error: any) {
      setErrorNotes(error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Startup #{id}</h1>
      <div className="flex space-x-4 mb-4">
        <button className={`px-4 py-2 rounded ${tab === 'info' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('info')}>Información General</button>
        <button className={`px-4 py-2 rounded ${tab === 'docs' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('docs')}>Documentos</button>
        <button className={`px-4 py-2 rounded ${tab === 'metrics' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('metrics')}>Métricas</button>
        <button className={`px-4 py-2 rounded ${tab === 'analysis' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('analysis')}>Análisis Completo</button>
        <button className={`px-4 py-2 rounded ${tab === 'ia' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('ia')}>Análisis IA</button>
        <button className={`px-4 py-2 rounded ${tab === 'notes' ? 'bg-blue-200' : 'bg-gray-200'}`} onClick={() => setTab('notes')}>Notas y Actividades</button>
      </div>
      <div className="border p-4 rounded bg-white shadow">
        {tab === 'info' && <p>Información general de la startup. (Próximamente)</p>}
        {tab === 'docs' && (
          <div>
            <DocumentUploader startupId={typeof id === 'string' ? id : undefined} />
            <h2 className="text-lg font-bold mb-2 mt-6">Documentos subidos</h2>
            {loadingDocs && <p>Cargando documentos...</p>}
            {errorDocs && <p className="text-red-600">Error: {errorDocs}</p>}
            {!loadingDocs && documents.length === 0 && <p>No hay documentos para esta startup.</p>}
            <ul className="space-y-2">
              {documents.map((doc: Document) => (
                <li key={doc.id} className="border rounded p-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{doc.name}</span> <span className="text-gray-500">({doc.type})</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleDocExpansion(doc.id)}
                        className="text-blue-600 underline"
                      >
                        {expandedDocs.has(doc.id) ? 'Ocultar IA' : 'Ver IA'}
                      </button>
                      <a
                        href={doc.url ? supabase.storage.from('documents').getPublicUrl(doc.url).data.publicUrl : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Ver/Descargar
                      </a>
                    </div>
                  </div>
                  {expandedDocs.has(doc.id) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      {doc.summary && (
                        <div className="mb-2">
                          <h4 className="font-semibold text-sm">Resumen:</h4>
                          <p className="text-sm">{doc.summary}</p>
                        </div>
                      )}
                      {doc.kpis && (
                        <div className="mb-2">
                          <h4 className="font-semibold text-sm">KPIs:</h4>
                          <p className="text-sm">{doc.kpis}</p>
                        </div>
                      )}
                      {doc.red_flags && (
                        <div className="mb-2">
                          <h4 className="font-semibold text-sm text-red-600">Red Flags:</h4>
                          <p className="text-sm text-red-600">{doc.red_flags}</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <button
              className="mt-4 px-3 py-1 bg-gray-200 rounded"
              onClick={() => setRefreshDocs((r: number) => r + 1)}
            >
              Refrescar documentos
            </button>
          </div>
        )}
        {tab === 'metrics' && (
          <div>
            <h2 className="text-lg font-bold mb-4">Métricas de la startup</h2>
            {loadingMetrics && <p>Cargando métricas...</p>}
            {errorMetrics && <p className="text-red-600">Error: {errorMetrics}</p>}
            {!loadingMetrics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ARR (Annual Recurring Revenue)</label>
                    <input
                      type="number"
                      value={metrics.arr || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('arr', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MRR (Monthly Recurring Revenue)</label>
                    <input
                      type="number"
                      value={metrics.mrr || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('mrr', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CAC (Customer Acquisition Cost)</label>
                    <input
                      type="number"
                      value={metrics.cac || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('cac', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">LTV (Lifetime Value)</label>
                    <input
                      type="number"
                      value={metrics.ltv || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('ltv', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Churn Rate (%)</label>
                    <input
                      type="number"
                      value={metrics.churn || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('churn', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Runway (meses)</label>
                    <input
                      type="number"
                      value={metrics.runway || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('runway', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Burn Rate (mensual)</label>
                    <input
                      type="number"
                      value={metrics.burn_rate || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('burn_rate', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número de Clientes</label>
                    <input
                      type="number"
                      value={metrics.customer_count || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('customer_count', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Crecimiento de Ingresos (%)</label>
                    <input
                      type="number"
                      value={metrics.revenue_growth || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetricChange('revenue_growth', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  onClick={saveMetrics}
                  disabled={savingMetrics}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {savingMetrics ? 'Guardando...' : 'Guardar Métricas'}
                </button>
              </div>
            )}
          </div>
        )}
        {tab === 'analysis' && (
          <StartupAnalysis startupId={typeof id === 'string' ? id : ''} startup={{ name: 'Startup', sector: 'Tech', country: 'Spain', stage: 'Seed' }} />
        )}
        {tab === 'ia' && <p>Análisis IA de la startup. (Próximamente)</p>}
        {tab === 'notes' && (
          <div>
            <h2 className="text-lg font-bold mb-4">Notas y Actividades</h2>
            {loadingNotes && <p>Cargando notas...</p>}
            {errorNotes && <p className="text-red-600">Error: {errorNotes}</p>}
            {!loadingNotes && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nueva nota:</label>
                  <textarea
                    value={newNote}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
                    className="w-full p-2 border rounded h-24"
                    placeholder="Escribe tu nota aquí..."
                  />
                  <button
                    onClick={saveNote}
                    disabled={savingNote || !newNote.trim()}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {savingNote ? 'Guardando...' : 'Guardar Nota'}
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Notas anteriores:</h3>
                  {notes.length === 0 ? (
                    <p className="text-gray-500">No hay notas para esta startup.</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((note: Note) => (
                        <div key={note.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-500">
                              {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                            </span>
                            <button
                              onClick={() => note.id && deleteNote(note.id)}
                              className="text-red-600 text-sm underline"
                            >
                              Eliminar
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 