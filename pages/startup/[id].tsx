import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DocumentUploader from '../../components/DocumentUploader';
import StartupAnalysis from '../../components/StartupAnalysis';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

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

// Tab icons
const InfoIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AnalysisIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const NotesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

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

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    setSavingNote(true);
    setErrorNotes(null);
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          startup_id: id,
          content: newNote.trim(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (error: any) {
      setErrorNotes(error.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Startup #{id}</h1>
          <p className="text-gray-600 mt-1">Gestión completa de la startup</p>
        </div>
        <Badge variant="primary">En análisis</Badge>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="info" onValueChange={(value) => setTab(value as any)}>
        <TabsList className="mb-8">
          <TabsTrigger value="info" icon={<InfoIcon />}>
            Información
          </TabsTrigger>
          <TabsTrigger value="docs" icon={<DocumentIcon />}>
            Documentos
          </TabsTrigger>
          <TabsTrigger value="metrics" icon={<ChartIcon />}>
            Métricas
          </TabsTrigger>
          <TabsTrigger value="analysis" icon={<AnalysisIcon />}>
            Análisis Completo
          </TabsTrigger>
          <TabsTrigger value="ia" icon={<AnalysisIcon />}>
            Análisis IA
          </TabsTrigger>
          <TabsTrigger value="notes" icon={<NotesIcon />}>
            Notas
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <InfoIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Información en desarrollo</h3>
                <p className="text-gray-600">
                  Esta sección contendrá información detallada sobre la startup, incluyendo descripción, equipo, y datos generales.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="docs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Subir Documentos</h2>
              </CardHeader>
              <CardContent>
                <DocumentUploader startupId={typeof id === 'string' ? id : undefined} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Documentos Subidos</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefreshDocs((r: number) => r + 1)}
                  >
                    Refrescar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDocs && (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-16"></div>
                    ))}
                  </div>
                )}

                {errorDocs && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    <p className="text-error-600">Error: {errorDocs}</p>
                  </div>
                )}

                {!loadingDocs && documents.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DocumentIcon />
                    </div>
                    <p className="text-gray-600">No hay documentos para esta startup.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {documents.map((doc: Document) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="gray" size="sm">{doc.type}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDocExpansion(doc.id)}
                          >
                            {expandedDocs.has(doc.id) ? 'Ocultar IA' : 'Ver IA'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (doc.url) {
                                window.open(
                                  supabase.storage.from('documents').getPublicUrl(doc.url).data.publicUrl,
                                  '_blank'
                                );
                              }
                            }}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>

                      {expandedDocs.has(doc.id) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          {doc.summary && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Resumen:</h4>
                              <p className="text-sm text-gray-700">{doc.summary}</p>
                            </div>
                          )}
                          {doc.kpis && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">KPIs:</h4>
                              <p className="text-sm text-gray-700">{doc.kpis}</p>
                            </div>
                          )}
                          {doc.red_flags && (
                            <div>
                              <h4 className="font-medium text-error-700 mb-2">Red Flags:</h4>
                              <p className="text-sm text-error-600">{doc.red_flags}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Continue with remaining tabs in the existing code structure... */}
        
        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Métricas de la Startup</h2>
            </CardHeader>
            <CardContent>
              {loadingMetrics && (
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-16"></div>
                  ))}
                </div>
              )}

              {errorMetrics && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <p className="text-error-600">Error: {errorMetrics}</p>
                </div>
              )}

              {!loadingMetrics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="ARR (Annual Recurring Revenue)"
                      type="number"
                      value={metrics.arr || ''}
                      onChange={(e) => handleMetricChange('arr', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="MRR (Monthly Recurring Revenue)"
                      type="number"
                      value={metrics.mrr || ''}
                      onChange={(e) => handleMetricChange('mrr', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="CAC (Customer Acquisition Cost)"
                      type="number"
                      value={metrics.cac || ''}
                      onChange={(e) => handleMetricChange('cac', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="LTV (Customer Lifetime Value)"
                      type="number"
                      value={metrics.ltv || ''}
                      onChange={(e) => handleMetricChange('ltv', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="Churn Rate (%)"
                      type="number"
                      value={metrics.churn || ''}
                      onChange={(e) => handleMetricChange('churn', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="Runway (meses)"
                      type="number"
                      value={metrics.runway || ''}
                      onChange={(e) => handleMetricChange('runway', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="Burn Rate"
                      type="number"
                      value={metrics.burn_rate || ''}
                      onChange={(e) => handleMetricChange('burn_rate', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label="Customer Count"
                      type="number"
                      value={metrics.customer_count || ''}
                      onChange={(e) => handleMetricChange('customer_count', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveMetrics}
                      loading={savingMetrics}
                      disabled={savingMetrics}
                    >
                      Guardar Métricas
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <StartupAnalysis startupId={typeof id === 'string' ? id : undefined} />
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Análisis con IA</h2>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AnalysisIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Análisis IA en desarrollo</h3>
                <p className="text-gray-600">
                  Esta funcionalidad proporcionará análisis automático mediante inteligencia artificial.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Agregar Nota</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escribe una nota sobre esta startup..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={addNote}
                      loading={savingNote}
                      disabled={savingNote || !newNote.trim()}
                    >
                      Agregar Nota
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Notas y Actividades</h2>
              </CardHeader>
              <CardContent>
                {loadingNotes && (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
                    ))}
                  </div>
                )}

                {errorNotes && (
                  <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                    <p className="text-error-600">Error: {errorNotes}</p>
                  </div>
                )}

                {!loadingNotes && notes.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <NotesIcon />
                    </div>
                    <p className="text-gray-600">No hay notas para esta startup.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {notes.map((note: Note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <p className="text-sm text-gray-500">
                        {note.created_at && new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 