import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  // CORS nao impede uma gravacao CSRF. Rejeita a origem antes de executar a API.
  if (req.nextUrl.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const permitidas = [req.nextUrl.origin, 'https://semae-varzeadopoco.vercel.app',
      'https://localhost', 'http://localhost', 'capacitor://localhost'];
    if ((!origin && req.headers.get('sec-fetch-site') !== 'same-origin') || (origin && !permitidas.includes(origin)))
      return NextResponse.json({ erro: 'Origem da requisicao nao permitida.' }, { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  if (req.nextUrl.pathname.startsWith('/api/') || req.nextUrl.pathname.endsWith('/pdf')) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/api/:path*', '/:tipo/:id/pdf'] };
