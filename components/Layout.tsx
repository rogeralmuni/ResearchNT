import Link from 'next/link';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow p-4 flex space-x-4">
        <Link href="/" className="font-bold text-lg">Dashboard</Link>
        <Link href="/upload">Carga Inteligente</Link>
        <Link href="/explorer">Buscador IA</Link>
        <Link href="/compare">Comparador</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
} 