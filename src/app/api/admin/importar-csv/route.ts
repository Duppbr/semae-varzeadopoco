import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string;
    const sobrescreverPrecos = formData.get('sobrescreverPrecos') === 'true';
    const lojaId = formData.get('lojaId') ? parseInt(formData.get('lojaId') as string) : null;

    if (!file || !tipo) {
      return NextResponse.json({ erro: 'Arquivo e tipo são obrigatórios' }, { status: 400 });
    }

    if ((tipo === 'estoque' || tipo === 'custo') && !lojaId) {
      return NextResponse.json({ erro: 'lojaId é obrigatório para estoque e custo' }, { status: 400 });
    }

    const texto = await file.text();
    const parsed = Papa.parse(texto, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ erro: 'Erro ao ler CSV', detalhes: parsed.errors }, { status: 400 });
    }

    const linhas = parsed.data as any[];
    const resultado = { processadas: 0, erros: [] as string[] };

    if (tipo === 'estoque') {
      // Novo formato real: SKU;Descrição;Marca;Depósito;Filial;Qtd;Qtd reservada;Total;Custo
      for (const linha of linhas) {
        const sku = (linha.SKU || '').trim();
        const qtd = parseInt(linha.Qtd || '0');

        if (!sku) {
          resultado.erros.push(`Linha com SKU vazio`);
          continue;
        }

        const produto = await prisma.produto.findUnique({ where: { sku } });
        if (!produto) {
          resultado.erros.push(`SKU ${sku} não encontrado`);
          continue;
        }

        // Atualiza ou cria registro apenas para a loja selecionada
        await prisma.produtoLoja.upsert({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaId! } },
          create: {
            produtoId: produto.id,
            lojaId: lojaId!,
            quantidadeEstoque: qtd,
          },
          update: {
            quantidadeEstoque: qtd,
          },
        });
        resultado.processadas++;
      }
    } else if (tipo === 'produtos') {
      // Produtos: SKU;Nome;Marca;Amperagem;Tipo;CCA;Garantia
      for (const linha of linhas) {
        const sku = (linha.SKU || '').trim();
        const nome = (linha.Nome || '').trim();
        const marca = (linha.Marca || '').trim();
        const amperagem = (linha.Amperagem || '').trim() || null;
        const tipoBateria = (linha.Tipo || '').trim() || null;
        const cca = parseInt(linha.CCA) || null;
        const garantia = (linha.Garantia || '').trim() || null;

        if (!sku || !nome || !marca) {
          resultado.erros.push(`Linha com SKU/Nome/Marca vazios`);
          continue;
        }

        const existente = await prisma.produto.findUnique({ where: { sku } });
        if (existente) continue;

        const produto = await prisma.produto.create({
          data: { sku, nome, marca, amperagem, tipo: tipoBateria, cca, garantia },
        });

        // Cria registros vazios nas duas lojas
        for (const idLoja of [1, 2]) {
          await prisma.produtoLoja.create({
            data: {
              produtoId: produto.id,
              lojaId: idLoja,
              quantidadeEstoque: 0,
            },
          });
        }
        resultado.processadas++;
      }
    } else if (tipo === 'custo') {
      // Relação de custo: SKU;PrecoSugerido (ou pode ter nome/marca)
      for (const linha of linhas) {
        const sku = (linha.SKU || '').trim();
        const nome = (linha.Produto || linha.Nome || '').trim();
        const marca = (linha.Marca || '').trim();
        const precoSugerido = parseFloat(linha.PrecoSugerido || '0');

        let produto;
        if (sku) {
          produto = await prisma.produto.findUnique({ where: { sku } });
        } else if (nome && marca) {
          produto = await prisma.produto.findFirst({ where: { nome, marca } });
        }

        if (!produto) {
          resultado.erros.push(`Produto não encontrado para SKU ${sku || nome}`);
          continue;
        }

        const registro = await prisma.produtoLoja.findUnique({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaId! } },
        });
        if (!registro) {
          resultado.erros.push(`Registro de loja não encontrado para SKU ${produto.sku}`);
          continue;
        }

        if (sobrescreverPrecos || !registro.precoCartao || registro.precoCartao === 0) {
          await prisma.produtoLoja.update({
            where: { id: registro.id },
            data: {
              precoSugerido: precoSugerido,
              precoCartao: precoSugerido,
              precoCartao3x: parseFloat((precoSugerido * 0.97).toFixed(2)),
              precoAvista: parseFloat((precoSugerido * 0.95).toFixed(2)),
              precoAvistaMinimo: parseFloat((precoSugerido * 0.93).toFixed(2)),
            },
          });
        }
        resultado.processadas++;
      }
    }

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ erro: 'Erro interno', detalhe: error.message }, { status: 500 });
  }
}