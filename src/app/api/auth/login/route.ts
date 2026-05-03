import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';

export async function POST(req: NextRequest) {
  const { identificador, senha } = await req.json();

  if (!identificador || !senha) {
    await registrarAuditoria({
      req,
      acao: 'login',
      entidade: 'Usuario',
      status: 'erro',
      resumo: 'Tentativa de login sem ID ou senha.',
      detalhes: { identificador: identificador || null },
    });
    return NextResponse.json({ erro: 'ID e senha sao obrigatorios' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findFirst({
    where: { identificador, ativo: true },
  });

  if (!usuario) {
    await registrarAuditoria({
      req,
      acao: 'login',
      entidade: 'Usuario',
      status: 'erro',
      resumo: `Login recusado para ID ${identificador}.`,
      detalhes: { identificador, motivo: 'usuario_nao_encontrado_ou_inativo' },
    });
    return NextResponse.json({ erro: 'Usuario ou senha invalidos' }, { status: 401 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    await registrarAuditoria({
      req,
      session: {
        userId: usuario.id,
        nome: usuario.nome,
        identificador: usuario.identificador,
      },
      acao: 'login',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      status: 'erro',
      resumo: `Senha incorreta para ${usuario.nome}.`,
      detalhes: { identificador },
    });
    return NextResponse.json({ erro: 'Usuario ou senha invalidos' }, { status: 401 });
  }

  const session = await getSession();
  session.userId = usuario.id;
  session.identificador = usuario.identificador;
  session.nome = usuario.nome;
  session.role = usuario.role;
  session.lojaId = usuario.lojaId;
  session.protegido = usuario.protegido;
  session.isLoggedIn = true;
  await session.save();

  await registrarAuditoria({
    req,
    session,
    acao: 'login',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    resumo: `${usuario.nome} entrou no sistema.`,
    detalhes: {
      role: usuario.role,
      lojaId: usuario.lojaId,
      protegido: usuario.protegido,
    },
  });

  return NextResponse.json({ ok: true, role: usuario.role, lojaId: usuario.lojaId });
}
