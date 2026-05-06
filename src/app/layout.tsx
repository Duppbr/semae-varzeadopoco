import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEMAE – Alimentação Escolar',
  description: 'Sistema de controle de estoque e merenda escolar – Várzea do Poço',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'SEMAE',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
