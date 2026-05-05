import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const [produtos, opcoes, atalhos] = await Promise.all([
    prisma.produto.findMany({ include: { lojas: true } }),
    prisma.opcao.findMany({ orderBy: [{ categoria: 'asc' }, { valor: 'asc' }] }),
    prisma.atalho.findMany({ orderBy: { posicao: 'asc' } }),
  ]);

  const backup = {
    versao: 2,
    data: new Date().toISOString(),
    resumo: {
      produtos: produtos.length,
      opcoes: opcoes.length,
      atalhos: atalhos.length,
    },
    produtos: produtos.map(p => ({
      sku: p.sku,
      nome: p.nome,
      marca: p.marca,
      categoria: p.categoria,
      amperagem: p.amperagem,
      tipo: p.tipo,
      cca: p.cca,
      garantia: p.garantia,
      lojas: p.lojas.map(l => ({
        lojaId: l.lojaId,
        precoCartao: l.precoCartao,
        precoCartao3x: l.precoCartao3x,
        precoAvista: l.precoAvista,
        precoAvistaMinimo: l.precoAvistaMinimo,
        precoSugerido: l.precoSugerido,
        quantidadeEstoque: l.quantidadeEstoque,
        ativo: l.ativo,
        prioridade: l.prioridade,
      })),
    })),
    opcoes,
    atalhos: atalhos.map(a => ({
      posicao: a.posicao,
      amperagem: a.amperagem,
      tipo: a.tipo,
      marca: a.marca,
      ativo: a.ativo,
    })),
  };

  await registrarAuditoria({
    session,
    acao: 'backup_exportado',
    entidade: 'Backup',
    resumo: `${session.nome} exportou backup v2.`,
    detalhes: backup.resumo,
  });

  return NextResponse.json(backup);
}
