import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { corsMobile, optionsResponse } from '@/lib/cors-mobile';

export async function OPTIONS(req: NextRequest) {
  return optionsResponse(req);
}

function parseDispositivo(ua: string | null): string {
  if (!ua) return 'Desconhecido';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let os = '';
  if (/Android/i.test(ua)) { const m = ua.match(/Android ([\d.]+)/); os = m ? `Android ${m[1]}` : 'Android'; }
  else if (/iPhone/i.test(ua)) os = 'iPhone';
  else if (/iPad/i.test(ua)) os = 'iPad';
  else if (/Windows NT 10/i.test(ua)) os = 'Windows 10';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let browser = '';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) { const m = ua.match(/Chrome\/([\d]+)/); browser = `Chrome ${m?.[1] ?? ''}`; }
  else if (/Firefox\//i.test(ua)) { const m = ua.match(/Firefox\/([\d]+)/); browser = `Firefox ${m?.[1] ?? ''}`; }
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  return [isMobile ? 'Celular' : 'Computador', os, browser].filter(Boolean).join(' · ');
}

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
    return NextResponse.json({ erro: 'ID e senha sao obrigatorios' }, { status: 400, headers: corsMobile(req) });
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
    return NextResponse.json({ erro: 'Usuario ou senha invalidos' }, { status: 401, headers: corsMobile(req) });
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
    return NextResponse.json({ erro: 'Usuario ou senha invalidos' }, { status: 401, headers: corsMobile(req) });
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

  const ua = req.headers.get('user-agent');
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
      dispositivo: parseDispositivo(ua),
    },
  });

  return NextResponse.json({ ok: true, role: usuario.role, lojaId: usuario.lojaId, nome: usuario.nome }, { headers: corsMobile(req) });
}
