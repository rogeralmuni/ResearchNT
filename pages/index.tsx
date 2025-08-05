import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  country: string;
  description?: string;
  team_info?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchStartups() {
      setLoading(true);
      
      try {
        const response = await fetch('/api/startups');
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setStartups(data.startups || []);
          setFilteredStartups(data.startups || []);
        }
      } catch (error) {
        console.error('Error fetching startups:', error);
        setError('Failed to load startups');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStartups();
  }, []);

  // Filter startups based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStartups(startups);
    } else {
      const filtered = startups.filter(startup =>
        startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStartups(filtered);
    }
  }, [searchTerm, startups]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            StartupVault
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover, analyze, and compare the most promising startups in your portfolio
          </p>
        </div>
      </div>

      {/* Startups Table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Startups Database</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search startups by name, sector, stage, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-gray-600">Loading startups...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && filteredStartups.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-500">No startups found matching "{searchTerm}".</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {!loading && filteredStartups.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-500">No startups registered yet.</p>
          </div>
        )}

        {!loading && filteredStartups.length > 0 && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Startup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStartups.map((startup) => (
                    <tr key={startup.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {startup.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{startup.name}</div>
                            {startup.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {startup.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {startup.sector}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {startup.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {startup.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/startup/${startup.id}`}
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && searchTerm && filteredStartups.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              Showing {filteredStartups.length} of {startups.length} startups
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 