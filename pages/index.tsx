import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import StartupCard from '../components/StartupCard';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';

interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  country: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Carga Inteligente',
    description: 'Sube y analiza documentos de startups automáticamente',
    href: '/upload',
    color: 'bg-primary-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  {
    title: 'Buscador IA',
    description: 'Encuentra información específica usando inteligencia artificial',
    href: '/explorer',
    color: 'bg-success-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: 'Comparador',
    description: 'Compara métricas y KPIs entre diferentes startups',
    href: '/compare',
    color: 'bg-warning-500',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStartups() {
      setLoading(true);
      const { data, error } = await supabase
        .from('startups')
        .select('id, name, sector, stage, country')
        .limit(6); // Limit to 6 for better layout
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
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Panel de Control VC
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Gestiona y analiza tu portafolio de startups con herramientas inteligentes
        </p>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} text-white`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Startups Overview */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Startups Recientes</h2>
          {!loading && startups.length > 6 && (
            <Link href="/startup">
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            </Link>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-error-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar startups</h3>
              <p className="text-gray-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && startups.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay startups registradas</h3>
              <p className="text-gray-600 mb-6">Comienza agregando tu primera startup al portafolio</p>
              <Link href="/upload">
                <Button>Agregar Startup</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!loading && !error && startups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </section>
    </div>
  );
} 