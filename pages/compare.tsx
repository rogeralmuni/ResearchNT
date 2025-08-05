import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  country: string;
}

interface Metrics {
  startup_id: string;
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

const metricDefinitions = [
  { key: 'arr', label: 'ARR', format: 'currency', description: 'Annual Recurring Revenue' },
  { key: 'mrr', label: 'MRR', format: 'currency', description: 'Monthly Recurring Revenue' },
  { key: 'cac', label: 'CAC', format: 'currency', description: 'Customer Acquisition Cost' },
  { key: 'ltv', label: 'LTV', format: 'currency', description: 'Customer Lifetime Value' },
  { key: 'churn', label: 'Churn Rate', format: 'percentage', description: 'Monthly customer churn rate' },
  { key: 'runway', label: 'Runway', format: 'months', description: 'Months of cash remaining' },
  { key: 'burn_rate', label: 'Burn Rate', format: 'currency', description: 'Monthly cash burn' },
  { key: 'customer_count', label: 'Customers', format: 'number', description: 'Total customer count' },
  { key: 'revenue_growth', label: 'Growth', format: 'percentage', description: 'Monthly revenue growth' },
];

export default function ComparePage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Record<string, Metrics>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStartups() {
      setLoading(true);
      const { data, error } = await supabase
        .from('startups')
        .select('id, name, sector, stage, country');
      if (error) {
        setError(error.message);
      } else {
        setStartups(data || []);
      }
      setLoading(false);
    }
    fetchStartups();
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
      if (selectedStartups.length === 0) {
        setMetrics({});
        return;
      }

      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .in('startup_id', selectedStartups);

      if (error) {
        setError(error.message);
      } else {
        const metricsMap: Record<string, Metrics> = {};
        data?.forEach((metric) => {
          metricsMap[metric.startup_id] = metric;
        });
        setMetrics(metricsMap);
      }
    }

    fetchMetrics();
  }, [selectedStartups]);

  const toggleStartupSelection = (startupId: string) => {
    setSelectedStartups(prev => 
      prev.includes(startupId)
        ? prev.filter(id => id !== startupId)
        : [...prev, startupId]
    );
  };

  const getStartupName = (startupId: string) => {
    return startups.find(s => s.id === startupId)?.name || startupId;
  };

  const getStartup = (startupId: string) => {
    return startups.find(s => s.id === startupId);
  };

  const formatMetric = (value: number | undefined, format: string) => {
    if (value === undefined || value === null) return '-';
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'months':
        return `${value} ${value === 1 ? 'mes' : 'meses'}`;
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getBestValue = (metricKey: string, format: string) => {
    if (selectedStartups.length === 0) return null;
    
    const values = selectedStartups
      .map(id => metrics[id]?.[metricKey as keyof Metrics])
      .filter(val => val !== undefined && val !== null) as number[];
    
    if (values.length === 0) return null;
    
    // For churn and burn_rate, lower is better; for others, higher is better
    const isLowerBetter = metricKey === 'churn' || metricKey === 'burn_rate' || metricKey === 'cac';
    return isLowerBetter ? Math.min(...values) : Math.max(...values);
  };

  const isHighlighted = (value: number | undefined, metricKey: string) => {
    if (!value) return false;
    const bestValue = getBestValue(metricKey, 'number');
    return bestValue === value;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Comparador de Startups
        </h1>
        <p className="text-lg text-gray-600">
          Compara métricas clave entre diferentes startups de tu portafolio
        </p>
      </div>

      {/* Startup Selection */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            Selecciona Startups para Comparar
          </h2>
          <p className="text-gray-600">
            Escoge hasta 4 startups para hacer una comparación detallada
          </p>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <p className="text-error-600">Error: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {startups.map((startup) => (
                <div
                  key={startup.id}
                  onClick={() => toggleStartupSelection(startup.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedStartups.includes(startup.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{startup.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="gray" size="sm">{startup.sector}</Badge>
                        <Badge variant="primary" size="sm">{startup.stage}</Badge>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedStartups.includes(startup.id)
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedStartups.includes(startup.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedStartups.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>{selectedStartups.length}</strong> startup{selectedStartups.length !== 1 ? 's' : ''} seleccionada{selectedStartups.length !== 1 ? 's' : ''} para comparar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedStartups.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Comparación de Métricas</h2>
            <p className="text-gray-600">Los valores destacados representan el mejor rendimiento en cada métrica</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-medium text-gray-900">Métrica</th>
                    {selectedStartups.map((startupId) => {
                      const startup = getStartup(startupId);
                      return (
                        <th key={startupId} className="text-left py-4 px-4 font-medium text-gray-900 min-w-[140px]">
                          <div>
                            <div className="font-semibold">{startup?.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{startup?.stage}</div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {metricDefinitions.map((metric, index) => (
                    <tr key={metric.key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{metric.label}</div>
                          <div className="text-xs text-gray-500">{metric.description}</div>
                        </div>
                      </td>
                      {selectedStartups.map((startupId) => {
                        const value = metrics[startupId]?.[metric.key as keyof Metrics] as number;
                        const isHighlightedValue = isHighlighted(value, metric.key);
                        
                        return (
                          <td key={startupId} className="py-4 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${
                              isHighlightedValue
                                ? 'bg-success-100 text-success-800 border border-success-200'
                                : 'text-gray-900'
                            }`}>
                              {formatMetric(value, metric.format)}
                              {isHighlightedValue && (
                                <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {selectedStartups.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona startups para comparar</h3>
            <p className="text-gray-600">Escoge al menos una startup de la lista anterior para ver sus métricas comparativas</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 