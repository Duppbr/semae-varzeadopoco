import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const rolesPermitidas = new Set(['funcionario', 'supervisor', 'admin']);

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const usuarios = await prisma.usuario.findMany({
    include: { loja: true },
    orderBy: [
      { protegido: 'desc' },
      { ativo: 'desc' },
      { id: 'asc' },
    ],
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const { identificador, senha, nome, role, lojaId } = await req.json();
  if (!identificador || !senha || !nome || !role || !lojaId) {
    return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });
  }
  if (!rolesPermitidas.has(role)) {
    return NextResponse.json({ erro: 'Funcao invalida' }, { status: 400 });
  }
  if (String(senha).length < 4) {
    return NextResponse.json({ erro: 'Senha deve ter pelo menos 4 caracteres' }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { identificador } });
  if (existente) {
    return NextResponse.json({ erro: 'ID ja existe' }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      identificador,
      senhaHash,
      nome,
      role,
      lojaId,
      ativo: true,
      protegido: false,
    },
  });

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_criado',
    entidade: 'Usuario',
    entidadeId: usuario.id,
    resumo: `${session.nome} criou o usuario ${usuario.nome}.`,
    detalhes: {
      identificador: usuario.identificador,
      role: usuario.role,
      lojaId: usuario.lojaId,
    },
  });

  return NextResponse.json(usuario);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const { id, ativo } = await req.json();
  if (!id || typeof ativo !== 'boolean') {
    return NextResponse.json({ erro: 'ID e status sao obrigatorios' }, { status: 400 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id } });
  if (!alvo) {
    return NextResponse.json({ erro: 'Usuario nao encontrado' }, { status: 404 });
  }
  if (alvo.protegido && ativo === false) {
    return NextResponse.json({
      erro: 'Este usuario e o dono protegido do sistema e nao pode ser desativado.',
    }, { status: 403 });
  }
  if (alvo.role === 'admin' && ativo === false) {
    const outrosAdminsAtivos = await prisma.usuario.count({
      where: { id: { not: id }, role: 'admin', ativo: true },
    });
    if (outrosAdminsAtivos === 0) {
      return NextResponse.json({
        erro: 'Nao e possivel desativar o ultimo administrador ativo.',
      }, { status: 403 });
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ativo },
  });

  await registrarAuditoria({
    req,
    session,
    acao: ativo ? 'usuario_ativado' : 'usuario_desativado',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `${session.nome} ${ativo ? 'ativou' : 'desativou'} o usuario ${usuario.nome}.`,
    detalhes: {
      usuario: { id: usuario.id, identificador: usuario.identificador, nome: usuario.nome, role: usuario.role },
      protegido: usuario.protegido,
    },
  });

  return NextResponse.json(usuario);
}

// MUDANÇA: rota DELETE para excluir usuário permanentemente.
// Bloqueia exclusão de usuários protegidos (donos) e do próprio usuário logado.
// A confirmação visual (digitar o identificador) é feita no frontend — aqui só a lógica de negócio.
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ erro: 'ID obrigatorio' }, { status: 400 });
  }

  const alvo = await prisma.usuario.findUnique({ where: { id } });
  if (!alvo) {
    return NextResponse.json({ erro: 'Usuario nao encontrado' }, { status: 404 });
  }
  if (alvo.protegido) {
    return NextResponse.json({ erro: 'O usuario dono protegido nao pode ser excluido.' }, { status: 403 });
  }
  if (alvo.id === session.userId) {
    return NextResponse.json({ erro: 'Voce nao pode excluir sua propria conta.' }, { status: 403 });
  }

  await prisma.usuario.delete({ where: { id } });

  await registrarAuditoria({
    req,
    session,
    acao: 'usuario_excluido',
    entidade: 'Usuario',
    entidadeId: id,
    resumo: `${session.nome} excluiu o usuario ${alvo.nome} (${alvo.identificador}).`,
    detalhes: {
      id: alvo.id,
      identificador: alvo.identificador,
      nome: alvo.nome,
      role: alvo.role,
      lojaId: alvo.lojaId,
    },
  });

  return NextResponse.json({ ok: true });
}
