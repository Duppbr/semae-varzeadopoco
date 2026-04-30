import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const opcoes = JSON.parse(formData.get('opcoes') as string);
    const texto = await file.text();
    const backup = JSON.parse(texto);

    if (!backup.produtos) {
      return NextResponse.json({ erro: 'Formato de backup inválido' }, { status: 400 });
    }

    let atualizacoes = 0;
    for (const prod of backup.produtos) {
      const produto = await prisma.produto.findUnique({ where: { sku: prod.sku } });
      if (!produto) continue;

      // Restaura dados comuns
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

      // Para cada loja no backup
      for (const lojaBackup of prod.lojas) {
        const registro = await prisma.produtoLoja.findUnique({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaBackup.lojaId } },
        });
        if (!registro) continue;

        const data: any = {};

        // Estoque
        const isMatriz = lojaBackup.lojaId === 1;
        if ((isMatriz && opcoes.estoqueMatriz) || (!isMatriz && opcoes.estoqueFilial)) {
          data.quantidadeEstoque = lojaBackup.quantidadeEstoque;
        }

        // Preços
        if ((isMatriz && opcoes.precosMatriz) || (!isMatriz && opcoes.precosFilial)) {
          data.precoCartao = lojaBackup.precoCartao;
          data.precoCartao3x = lojaBackup.precoCartao3x;
          data.precoAvista = lojaBackup.precoAvista;
          data.precoAvistaMinimo = lojaBackup.precoAvistaMinimo;
          data.precoSugerido = lojaBackup.precoSugerido;
        }

        // Prioridade/Ativo
        if ((isMatriz && opcoes.prioridadeMatriz) || (!isMatriz && opcoes.prioridadeFilial)) {
          data.ativo = lojaBackup.ativo;
          data.prioridade = lojaBackup.prioridade;
        }

        if (Object.keys(data).length > 0) {
          await prisma.produtoLoja.update({
            where: { id: registro.id },
            data,
          });
          atualizacoes++;
        }
      }
    }

    // Opcional: restaurar opções
    if (opcoes.opcoes && backup.opcoes) {
      for (const op of backup.opcoes) {
        await prisma.opcao.upsert({
          where: { categoria_valor: { categoria: op.categoria, valor: op.valor } },
          update: {},
          create: op,
        });
      }
    }

    return NextResponse.json({ mensagem: `Restauração concluída. ${atualizacoes} registros atualizados.` });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}