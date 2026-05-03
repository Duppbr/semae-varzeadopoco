import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionOptions, type SessionData } from '@/lib/session';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next();
  }

  if (path.startsWith('/consulta') || path.startsWith('/admin')) {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }

    if (path.startsWith('/admin') && session.role !== 'admin') {
      return NextResponse.redirect(new URL(`/consulta/${session.lojaId}`, request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/consulta/:path*', '/admin/:path*', '/login'],
};
