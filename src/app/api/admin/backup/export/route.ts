import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const produtos = await prisma.produto.findMany({
    include: { lojas: true },
  });

  const opcoes = await prisma.opcao.findMany();

  // Monta um objeto estruturado (sem dados de usuário/senha)
  const backup = {
    data: new Date().toISOString(),
    produtos: produtos.map(p => ({
      sku: p.sku,
      nome: p.nome,
      marca: p.marca,
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
  };

  await registrarAuditoria({
    session,
    acao: 'backup_exportado',
    entidade: 'Backup',
    resumo: `${session.nome} exportou um backup.`,
    detalhes: {
      produtos: produtos.length,
      opcoes: opcoes.length,
    },
  });

  return NextResponse.json(backup);
}
