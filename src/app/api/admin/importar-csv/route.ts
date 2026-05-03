import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { registrarAuditoria } from '@/lib/auditoria';
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

type LinhaCsv = Record<string, string | undefined>;

export async function POST(req: NextRequest) {
  const session = await getSession();
  try {
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string;
    const sobrescreverPrecos = formData.get('sobrescreverPrecos') === 'true';
    const lojaId = formData.get('lojaId') ? parseInt(formData.get('lojaId') as string) : null;

    if (!file || !tipo) {
      return NextResponse.json({ erro: 'Arquivo e tipo sao obrigatorios' }, { status: 400 });
    }
    if ((tipo === 'estoque' || tipo === 'custo') && !lojaId) {
      return NextResponse.json({ erro: 'lojaId e obrigatorio para estoque e custo' }, { status: 400 });
    }

    const texto = await file.text();
    const parsed = Papa.parse<LinhaCsv>(texto, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';',
    });

    if (parsed.errors.length > 0) {
      await registrarAuditoria({
        req,
        session,
        acao: 'csv_importado',
        entidade: 'ImportacaoCSV',
        status: 'erro',
        resumo: `Erro ao ler CSV de ${tipo}.`,
        detalhes: { arquivo: file.name, tipo, erros: parsed.errors.slice(0, 10) },
      });
      return NextResponse.json({ erro: 'Erro ao ler CSV', detalhes: parsed.errors }, { status: 400 });
    }

    const linhas = parsed.data;
    const resultado = { processadas: 0, erros: [] as string[] };

    if (tipo === 'estoque') {
      for (const linha of linhas) {
        const sku = (linha.SKU || '').trim();
        const qtd = parseInt(linha.Qtd || '0');

        if (!sku) {
          resultado.erros.push('Linha com SKU vazio');
          continue;
        }

        const produto = await prisma.produto.findUnique({ where: { sku } });
        if (!produto) {
          resultado.erros.push(`SKU ${sku} nao encontrado`);
          continue;
        }

        await prisma.produtoLoja.upsert({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaId! } },
          create: { produtoId: produto.id, lojaId: lojaId!, quantidadeEstoque: qtd },
          update: { quantidadeEstoque: qtd },
        });
        resultado.processadas++;
      }
    } else if (tipo === 'produtos') {
      for (const linha of linhas) {
        const sku = (linha.SKU || '').trim();
        const nome = (linha.Nome || '').trim();
        const marca = (linha.Marca || '').trim();
        const amperagem = (linha.Amperagem || '').trim() || null;
        const tipoBateria = (linha.Tipo || '').trim() || null;
        const cca = parseInt(linha.CCA || '') || null;
        const garantia = (linha.Garantia || '').trim() || null;

        if (!sku || !nome || !marca) {
          resultado.erros.push('Linha com SKU/Nome/Marca vazios');
          continue;
        }

        const existente = await prisma.produto.findUnique({ where: { sku } });
        if (existente) continue;

        const produto = await prisma.produto.create({
          data: { sku, nome, marca, amperagem, tipo: tipoBateria, cca, garantia },
        });

        for (const idLoja of [1, 2]) {
          await prisma.produtoLoja.create({
            data: { produtoId: produto.id, lojaId: idLoja, quantidadeEstoque: 0 },
          });
        }
        resultado.processadas++;
      }
    } else if (tipo === 'custo') {
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
          resultado.erros.push(`Produto nao encontrado para SKU ${sku || nome}`);
          continue;
        }

        const registro = await prisma.produtoLoja.findUnique({
          where: { produtoId_lojaId: { produtoId: produto.id, lojaId: lojaId! } },
        });
        if (!registro) {
          resultado.erros.push(`Registro de loja nao encontrado para SKU ${produto.sku}`);
          continue;
        }

        if (sobrescreverPrecos || !registro.precoCartao || registro.precoCartao === 0) {
          await prisma.produtoLoja.update({
            where: { id: registro.id },
            data: {
              precoSugerido,
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

    await registrarAuditoria({
      req,
      session,
      acao: 'csv_importado',
      entidade: 'ImportacaoCSV',
      status: resultado.erros.length > 0 ? 'parcial' : 'sucesso',
      resumo: `${session.nome} importou CSV de ${tipo}: ${resultado.processadas} linhas processadas.`,
      detalhes: {
        tipo,
        lojaId,
        arquivo: file.name,
        processadas: resultado.processadas,
        erros: resultado.erros.slice(0, 30),
      },
    });

    return NextResponse.json(resultado);
  } catch (error: unknown) {
    const detalhe = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(error);
    if (session?.isLoggedIn) {
      await registrarAuditoria({
        req,
        session,
        acao: 'csv_importado',
        entidade: 'ImportacaoCSV',
        status: 'erro',
        resumo: 'Erro ao importar CSV.',
        detalhes: { erro: detalhe },
      });
    }
    return NextResponse.json({ erro: 'Erro interno', detalhe }, { status: 500 });
  }
}
