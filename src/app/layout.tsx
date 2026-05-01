// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Rios Baterias - Consulta de Preços',
  description: 'Sistema interno de consulta de baterias',
  manifest: '/manifest.json', // <-- indica o manifesto
  icons: {
    icon: '/icon-192.png',    // ícone padrão
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
