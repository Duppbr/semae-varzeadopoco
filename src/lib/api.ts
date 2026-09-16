import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSession, type SessionData } from '@/lib/session';
import { corsMobile } from '@/lib/cors-mobile';
import { ErroValidacao } from '@/lib/validacao';

export async function api(req: NextRequest, fn: (session: SessionData) => Promise<unknown>, status = 200) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) throw new ErroValidacao('Sessao expirada. Entre novamente.', 401);
    return NextResponse.json(await fn(session), { status, headers: corsMobile(req) });
  } catch (error) {
    let codigo = 500;
    let erro = 'Nao foi possivel concluir. Tente novamente.';
    if (error instanceof ErroValidacao) { codigo = error.status; erro = error.message; }
    else if (error instanceof SyntaxError) { codigo = 400; erro = 'JSON invalido.'; }
    else if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code)) {
      codigo = 409; erro = 'Outra operacao alterou estes dados. Atualize a pagina antes de tentar novamente.';
    } else console.error('Falha na operacao SEMAE', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ erro }, { status: codigo, headers: corsMobile(req) });
  }
}
