// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Rios Baterias - Consulta de Preços',
  description: 'Sistema interno de consulta de baterias',
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