import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

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
  return getIronSession<SessionData>(cookieStore, options);
}
