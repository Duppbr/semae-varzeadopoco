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
  atalhos?: boolean;
  resetCompleto?: boolean; // apenas admin master (protegido)
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
        req, session,
        acao: 'backup_restaurado',
        entidade: 'Backup',
        status: 'erro',
        resumo: 'Tentativa de restaurar backup com formato invalido.',
      });
      return NextResponse.json({ erro: 'Formato de backup invalido' }, { status: 400 });
    }

    // Reset completo — apenas admin master (protegido)
    if (opcoes.resetCompleto) {
      if (!session.protegido) {
        return NextResponse.json({ erro: 'Reset completo e exclusivo do admin master.' }, { status: 403 });
      }
      // Apaga tudo em ordem para respeitar FKs
      await prisma.produtoLoja.deleteMany();
      await prisma.produto.deleteMany();
      await registrarAuditoria({
        req, session,
        acao: 'reset_completo',
        entidade: 'Backup',
        resumo: `${session.nome} executou reset completo do banco antes de restaurar.`,
      });
    }

    let criados = 0;
    let atualizacoes = 0;

    for (const prod of backup.produtos) {
      // Upsert do produto base (cria se não existe)
      const produto = await prisma.produto.upsert({
        where: { sku: prod.sku },
        update: opcoes.produtos ? {
          nome: prod.nome,
          marca: prod.marca,
          categoria: prod.categoria ?? null,
          amperagem: prod.amperagem ?? null,
          tipo: prod.tipo ?? null,
          cca: prod.cca ?? null,
          garantia: prod.garantia ?? null,
        } : {},
        create: {
          sku: prod.sku,
          nome: prod.nome,
          marca: prod.marca,
          categoria: prod.categoria ?? null,
          amperagem: prod.amperagem ?? null,
          tipo: prod.tipo ?? null,
          cca: prod.cca ?? null,
          garantia: prod.garantia ?? null,
        },
      });

      const foiCriado = !await prisma.produto.findUnique({ where: { id: produto.id, createdAt: produto.createdAt } });
      if (opcoes.resetCompleto) criados++;

      for (const lojaBackup of prod.lojas) {
        const isMatriz = lojaBackup.lojaId === 1;
        const data: Record<string, string | number | boolean | null> = {};

        if ((isMatriz && opcoes.estoqueMatriz) || (!isMatriz && opcoes.estoqueFilial)) {
          data.quantidadeEstoque = lojaBackup.quantidadeEstoque ?? 0;
        }
        if ((isMatriz && opcoes.precosMatriz) || (!isMatriz && opcoes.precosFilial)) {
          data.precoCartao = lojaBackup.precoCartao ?? null;
          data.precoCartao3x = lojaBackup.precoCartao3x ?? null;
          data.precoAvista = lojaBackup.precoAvista ?? null;
          data.precoAvistaMinimo = lojaBackup.precoAvistaMinimo ?? null;
          data.precoSugerido = lojaBackup.precoSugerido ?? null;
        }
        if ((isMatriz && opcoes.prioridadeMatriz) || (!isMatriz && opcoes.prioridadeFilial)) {
          data.ativo = lojaBackup.ativo ?? true;
          data.prioridade = lojaBackup.prioridade ?? 'verde';
        }

        if (Object.keys(data).length > 0 || opcoes.resetCompleto) {
          await prisma.produtoLoja.upsert({
            where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaBackup.lojaId } },
            update: data,
            create: {
              produtoId: produto.id,
              lojaId: lojaBackup.lojaId,
              precoCartao: lojaBackup.precoCartao ?? null,
              precoCartao3x: lojaBackup.precoCartao3x ?? null,
              precoAvista: lojaBackup.precoAvista ?? null,
              precoAvistaMinimo: lojaBackup.precoAvistaMinimo ?? null,
              precoSugerido: lojaBackup.precoSugerido ?? null,
              quantidadeEstoque: lojaBackup.quantidadeEstoque ?? 0,
              ativo: lojaBackup.ativo ?? true,
              prioridade: lojaBackup.prioridade ?? 'verde',
            },
          });
          atualizacoes++;
        }
      }
    }

    if (opcoes.opcoes && backup.opcoes?.length) {
      for (const op of backup.opcoes) {
        await prisma.opcao.upsert({
          where: { categoria_valor: { categoria: op.categoria, valor: op.valor } },
          update: {},
          create: { categoria: op.categoria, valor: op.valor },
        });
      }
    }

    if (opcoes.atalhos && backup.atalhos?.length) {
      if (opcoes.resetCompleto) await prisma.atalho.deleteMany();
      for (const a of backup.atalhos) {
        await prisma.atalho.create({
          data: {
            posicao: a.posicao ?? 0,
            amperagem: a.amperagem,
            tipo: a.tipo ?? null,
            marca: a.marca ?? null,
            ativo: a.ativo ?? true,
          },
        });
      }
    }

    await registrarAuditoria({
      req, session,
      acao: 'backup_restaurado',
      entidade: 'Backup',
      resumo: `${session.nome} restaurou backup: ${criados} criados, ${atualizacoes} atualizados.`,
      detalhes: { criados, atualizacoes, opcoes },
    });

    return NextResponse.json({
      mensagem: `Restauração concluída. ${criados > 0 ? `${criados} produtos criados, ` : ''}${atualizacoes} registros atualizados.`,
    });
  } catch (error: unknown) {
    const detalhe = error instanceof Error ? error.message : 'Erro desconhecido';
    await registrarAuditoria({
      req, session,
      acao: 'backup_restaurado',
      entidade: 'Backup',
      status: 'erro',
      resumo: 'Erro ao restaurar backup.',
      detalhes: { erro: detalhe },
    });
    return NextResponse.json({ erro: detalhe }, { status: 500 });
  }
}
