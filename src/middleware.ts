// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rotas públicas (sem autenticação)
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Proteger rotas de consulta e admin
  if (path.startsWith('/consulta') || path.startsWith('/admin')) {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }

    // Verificação extra para /admin: só admin
    if (path.startsWith('/admin') && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/consulta', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/consulta/:path*', '/admin/:path*', '/login'],
};