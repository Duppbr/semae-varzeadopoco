import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';

type RestoreOpcoes = {
  produtos?: boolean;
  estoqueMatriz?: boolean;
  estoqueFilial?: boolean;
  precosMatriz?: boolean;
  precosFilial?: boolean;
  prioridadeMatriz?: boolean;
  prioridadeFilial?: boolean;
  opcoes?: boolean;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const opcoes = JSON.parse(formData.get('opcoes') as string) as RestoreOpcoes;
    const texto = await file.text();
    const backup = JSON.parse(texto);

    if (!backup.produtos) {
      await registrarAuditoria({
        req,
        session,
        acao: 'backup_restaurado',
        entidade: 'Backup',
        status: 'erro',
        resumo: 'Tentativa de restaurar backup com formato invalido.',
      });
      return NextResponse.json({ erro: 'Formato de backup invalido' }, { status: 400 });
    }

    let atualizacoes = 0;
    for (const prod of backup.produtos) {
      const produto = await prisma.produto.findUnique({ where: { sku: prod.sku } });
      if (!produto) continue;

      if (opcoes.produtos) {
        await prisma.produto.update({
          where: { id: produto.id },
          data: {
            nome: prod.nome,
            marca: prod.marca,
            amperagem: prod.amperagem,
            tipo: prod.tipo,
            cca: prod.cca,
            garantia: prod.garantia,
          },
        });
      }

      for (const lojaBackup of prod.lojas) {
        const registro = await prisma.produtoLoja.findUnique({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaBackup.lojaId } },
        });
        if (!registro) continue;

        const data: Record<string, string | number | boolean | null> = {};
        const isMatriz = lojaBackup.lojaId === 1;

        if ((isMatriz && opcoes.estoqueMatriz) || (!isMatriz && opcoes.estoqueFilial)) {
          data.quantidadeEstoque = lojaBackup.quantidadeEstoque;
        }
        if ((isMatriz && opcoes.precosMatriz) || (!isMatriz && opcoes.precosFilial)) {
          data.precoCartao = lojaBackup.precoCartao;
          data.precoCartao3x = lojaBackup.precoCartao3x;
          data.precoAvista = lojaBackup.precoAvista;
          data.precoAvistaMinimo = lojaBackup.precoAvistaMinimo;
          data.precoSugerido = lojaBackup.precoSugerido;
        }
        if ((isMatriz && opcoes.prioridadeMatriz) || (!isMatriz && opcoes.prioridadeFilial)) {
          data.ativo = lojaBackup.ativo;
          data.prioridade = lojaBackup.prioridade;
        }

        if (Object.keys(data).length > 0) {
          await prisma.produtoLoja.update({ where: { id: registro.id }, data });
          atualizacoes++;
        }
      }
    }

    if (opcoes.opcoes && backup.opcoes) {
      for (const op of backup.opcoes) {
        await prisma.opcao.upsert({
          where: { categoria_valor: { categoria: op.categoria, valor: op.valor } },
          update: {},
          create: op,
        });
      }
    }

    await registrarAuditoria({
      req,
      session,
      acao: 'backup_restaurado',
      entidade: 'Backup',
      resumo: `${session.nome} restaurou backup com ${atualizacoes} registros atualizados.`,
      detalhes: { atualizacoes, opcoes },
    });

    return NextResponse.json({ mensagem: `Restauracao concluida. ${atualizacoes} registros atualizados.` });
  } catch (error: unknown) {
    const detalhe = error instanceof Error ? error.message : 'Erro desconhecido';
    await registrarAuditoria({
      req,
      session,
      acao: 'backup_restaurado',
      entidade: 'Backup',
      status: 'erro',
      resumo: 'Erro ao restaurar backup.',
      detalhes: { erro: detalhe },
    });
    return NextResponse.json({ erro: detalhe }, { status: 500 });
  }
}
