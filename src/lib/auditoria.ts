import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { SessionData } from '@/lib/session';

type SessaoAuditoria = Partial<SessionData> | null | undefined;

type RegistrarAuditoriaInput = {
  session?: SessaoAuditoria;
  req?: NextRequest | Request;
  acao: string;
  entidade: string;
  entidadeId?: string | number | null;
  status?: 'sucesso' | 'erro' | 'parcial' | 'info';
  resumo: string;
  detalhes?: unknown;
};

export async function registrarAuditoria({
  session,
  req,
  acao,
  entidade,
  entidadeId,
  status = 'sucesso',
  resumo,
  detalhes,
}: RegistrarAuditoriaInput) {
  try {
    const headers = req?.headers;
    const forwardedFor = headers?.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || headers?.get('x-real-ip') || null;
    const userAgent = headers?.get('user-agent') || null;

    await prisma.auditoria.create({
      data: {
        usuarioId: session?.userId || null,
        usuarioNome: session?.nome || null,
        usuarioIdentificador: session?.identificador || null,
        acao,
        entidade,
        entidadeId: entidadeId === null || entidadeId === undefined ? null : String(entidadeId),
        status,
        resumo,
        detalhes: detalhes === undefined || detalhes === null
          ? null
          : JSON.parse(JSON.stringify(detalhes)),
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Falha ao registrar auditoria:', error);
  }
}

export function diffCampos<T extends Record<string, unknown>>(antes: T, depois: T, campos: ReadonlyArray<keyof T>) {
  const alteracoes: Record<string, { antes: unknown; depois: unknown }> = {};
  for (const campo of campos) {
    if (antes[campo] !== depois[campo]) {
      alteracoes[String(campo)] = { antes: antes[campo] ?? null, depois: depois[campo] ?? null };
    }
  }
  return alteracoes;
}
