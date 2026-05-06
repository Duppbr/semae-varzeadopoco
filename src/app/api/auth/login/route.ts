import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

export async function POST(req: NextRequest) {
  const { identificador, senha } = await req.json();

  if (!identificador || !senha) {
    return NextResponse.json({ erro: 'Usuário e senha são obrigatórios.' }, { status: 400, headers: corsMobile(req) });
  }

  const usuario = await prisma.usuario.findFirst({ where: { identificador, ativo: true } });

  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    await registrarAuditoria({ req, acao: 'login', entidade: 'Usuario', status: 'erro', resumo: `Login recusado para ${identificador}.` });
    return NextResponse.json({ erro: 'Usuário ou senha inválidos.' }, { status: 401, headers: corsMobile(req) });
  }

  const session = await getSession();
  session.userId = usuario.id;
  session.identificador = usuario.identificador;
  session.nome = usuario.nome;
  session.role = usuario.role;
  session.protegido = usuario.protegido;
  session.isLoggedIn = true;
  await session.save();

  await registrarAuditoria({ req, session, acao: 'login', entidade: 'Usuario', entidadeId: usuario.id, resumo: `${usuario.nome} entrou no sistema.` });

  return NextResponse.json({ ok: true, role: usuario.role, nome: usuario.nome }, { headers: corsMobile(req) });
}
