import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export interface SessionData {
  userId: string;
  identificador: string;
  nome: string;
  role: string;
  protegido: boolean;
  isLoggedIn: boolean;
}

export async function getSession() {
  const pw = process.env.SECRET_COOKIE_PASSWORD ?? '';
  if (pw.length < 32) throw new Error('SECRET_COOKIE_PASSWORD deve ter pelo menos 32 caracteres.');
  const options: SessionOptions = {
    password: pw,
    cookieName: 'semae-session',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 15,
    },
  };
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, options);
  // Revoga acesso desativado e atualiza permissoes sem depender da expiracao do cookie.
  if (session.isLoggedIn) {
    const usuario = session.userId ? await prisma.usuario.findUnique({ where: { id: session.userId },
      select: { ativo: true, nome: true, role: true, protegido: true, identificador: true } }) : null;
    if (!usuario?.ativo) session.isLoggedIn = false;
    else Object.assign(session, { nome: usuario.nome, role: usuario.role, protegido: usuario.protegido, identificador: usuario.identificador });
  }
  return session;
}
