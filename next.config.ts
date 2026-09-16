import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  // Permite que a previa local isolada (scripts/preview-local.ts) use uma pasta
  // de build propria, evitando a trava "another next dev server is already running".
  // Sem a variavel, o comportamento e identico ao padrao ('.next').
  ...(process.env.PREVIEW_DISTDIR ? { distDir: process.env.PREVIEW_DISTDIR } : {}),
};

export default nextConfig;
