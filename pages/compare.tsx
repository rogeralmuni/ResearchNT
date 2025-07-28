import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  const formatMetric = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return value.toLocaleString();
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Comparador de Startups</h1>
      
      {loading && <p>Cargando startups...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Selecciona startups para comparar:</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {startups.map((startup) => (
            <label key={startup.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStartups.includes(startup.id)}
                onChange={() => toggleStartupSelection(startup.id)}
                className="rounded"
              />
              <span className="text-sm">{startup.name}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedStartups.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Métrica</th>
                {selectedStartups.map((startupId) => (
                  <th key={startupId} className="border border-gray-300 p-2 text-left">
                    {getStartupName(startupId)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">ARR</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    ${formatMetric(metrics[startupId]?.arr)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">MRR</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    ${formatMetric(metrics[startupId]?.mrr)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">CAC</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    ${formatMetric(metrics[startupId]?.cac)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">LTV</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    ${formatMetric(metrics[startupId]?.ltv)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Churn Rate</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    {formatPercentage(metrics[startupId]?.churn)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Runway (meses)</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    {formatMetric(metrics[startupId]?.runway)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Burn Rate</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    ${formatMetric(metrics[startupId]?.burn_rate)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Clientes</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    {formatMetric(metrics[startupId]?.customer_count)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">Crecimiento</td>
                {selectedStartups.map((startupId) => (
                  <td key={startupId} className="border border-gray-300 p-2">
                    {formatPercentage(metrics[startupId]?.revenue_growth)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selectedStartups.length === 0 && !loading && (
        <p className="text-gray-500">Selecciona al menos una startup para ver la comparación.</p>
      )}
    </div>
  );
} 