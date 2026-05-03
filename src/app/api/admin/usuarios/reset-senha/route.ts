import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const { id, novaSenha } = await req.json();
  if (!id || !novaSenha || novaSenha.length < 4) {
    return NextResponse.json({ erro: 'Senha deve ter pelo menos 4 caracteres' }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    return NextResponse.json({ erro: 'Usuario nao encontrado' }, { status: 404 });
  }
  if (usuario.protegido && usuario.id !== session.userId) {
    return NextResponse.json({
      erro: 'Este usuario e protegido. Apenas o proprio dono pode alterar a senha dele.',
    }, { status: 403 });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({
    where: { id },
    data: { senhaHash },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_senha_alterada',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `${session.nome} alterou a senha do usuario ${usuario.nome}.`,
    detalhes: {
      usuario: {
        id: usuario.id,
        identificador: usuario.identificador,
        nome: usuario.nome,
        protegido: usuario.protegido,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
