import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import StartupCard from '../components/StartupCard';

interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  country: string;
}

export default function Dashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <ul className="space-y-2 mb-8">
        <li><Link href="/startup/1"><span className="text-blue-600 underline">Startup Page Example</span></Link></li>
        <li><Link href="/upload"><span className="text-blue-600 underline">Carga Inteligente</span></Link></li>
        <li><Link href="/explorer"><span className="text-blue-600 underline">Buscador Inteligente (IA Chat)</span></Link></li>
        <li><Link href="/compare"><span className="text-blue-600 underline">Comparador de Startups</span></Link></li>
      </ul>
      <h2 className="text-xl font-semibold mb-2">Startups</h2>
      {loading && <p>Cargando startups...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && startups.length === 0 && <p>No hay startups registradas.</p>}
      <div className="space-y-4">
        {startups.map((startup) => (
          <Link key={startup.id} href={`/startup/${startup.id}`}>
            <StartupCard
              name={startup.name}
              sector={startup.sector}
              stage={startup.stage}
              country={startup.country}
            />
          </Link>
        ))}
      </div>
    </div>
  );
} 