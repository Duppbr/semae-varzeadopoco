// Fonte da verdade da reconciliacao do catalogo com o
// "Formulario de Controle de Saida de Produtos" da SEMAE (26/08/2026).
//
// Usado pelo preview local (para voce conferir) e, depois de aprovado,
// pela aplicacao na producao. Idempotente: pode rodar varias vezes.
//
// Unidades usadas: fd = Fardo, cx = Caixa, un = Unidade, kg = Quilograma.

import type { PrismaClient } from '@prisma/client';

// Produtos JA EXISTENTES cuja unidade passa a ser a do formulario (entrega).
// Chave = nome EXATO no banco.
export const TROCAR_UNIDADE: Record<string, string> = {
  'Açúcar': 'fd',
  'Arroz Parbolizado': 'fd',
  'Achocolatado em Pó': 'cx',
  'Azeite de Oliva': 'un',
  'Biscoito Doce': 'cx',
  'Biscoito Sal': 'cx',
  'Café': 'cx',
  'Coco Ralado': 'cx',
  'Creme de Leite': 'cx',
  'Ervilha': 'cx',
  'Extrato de Tomate': 'cx',
  'Molho de Tomate': 'cx',
  'Feijão Carioca': 'fd',
  'Feijão Preto': 'fd',
  'Flocão de Milho': 'fd',
  'Fubá': 'fd',
  'Leite em Pó': 'fd',
  'Leite de Coco': 'cx',
  'Leite Condensado': 'cx',
  'Macarrão de Sopa': 'fd',
  'Macarrão Espaguete': 'fd',
  'Macarrão Parafuso': 'fd',
  'Milho de Mungunzá': 'fd',
  'Milho Verde': 'fd',
  'Milho de Pipoca': 'fd',
  'Farinha de Trigo Com Fermento': 'fd',
  'Óleo de Soja': 'cx',
  'Sal': 'fd',
  'Cremogema Morango': 'cx',
  'Cremogema Chocolate': 'cx',
};

// Produtos do formulario que NAO existem no banco. Serao criados.
// unidadeDefinida=false marca os itens cuja unidade NAO estava no formulario
// (assumi um padrao razoavel; confirme).
export const NOVOS_PRODUTOS: { nome: string; unidade: string; categoria: string; unidadeDefinida: boolean }[] = [
  { nome: 'Peito de Frango', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: true },
  { nome: 'Coxa e Sobrecoxa', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: true },
  { nome: 'Coxão Mole', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: false },
  { nome: 'Músculo', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: false },
  { nome: 'Carne Moída', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: false },
  { nome: 'Fígado', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: false },
  { nome: 'Calabresa', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: true },
  { nome: 'Salsicha', unidade: 'kg', categoria: 'Carnes', unidadeDefinida: false },
  { nome: 'Proteína Texturizada de Soja', unidade: 'fd', categoria: 'Outros', unidadeDefinida: true },
  { nome: 'Margarina', unidade: 'cx', categoria: 'Laticínios', unidadeDefinida: true },
  { nome: 'Iogurte', unidade: 'un', categoria: 'Laticínios', unidadeDefinida: true },
  { nome: 'Aveia', unidade: 'pct', categoria: 'Farinhas e Derivados', unidadeDefinida: false },
  { nome: 'Farinha de Mandioca', unidade: 'pct', categoria: 'Farinhas e Derivados', unidadeDefinida: false },
  { nome: 'Leite Líquido Zero Lactose', unidade: 'L', categoria: 'Laticínios', unidadeDefinida: false },
];

export type Resultado = {
  atualizados: string[]; criados: string[]; semMudanca: string[]; avisos: string[];
};

export async function aplicarCatalogo(prisma: PrismaClient): Promise<Resultado> {
  const r: Resultado = { atualizados: [], criados: [], semMudanca: [], avisos: [] };

  const unidades = await prisma.unidadeMedida.findMany();
  const uById = new Map(unidades.map(u => [u.abreviacao.toLowerCase(), u]));
  const unidadeId = (ab: string) => {
    const u = uById.get(ab.toLowerCase());
    if (!u) throw new Error(`Unidade nao encontrada no banco: ${ab}`);
    return u.id;
  };

  // 1) Trocar unidade dos existentes
  for (const [nome, ab] of Object.entries(TROCAR_UNIDADE)) {
    const prod = await prisma.produto.findFirst({ where: { nome } });
    if (!prod) { r.avisos.push(`Nao achei para trocar unidade: "${nome}"`); continue; }
    const alvo = unidadeId(ab);
    if (prod.unidadeId === alvo) { r.semMudanca.push(`${nome} (ja em ${ab})`); continue; }
    await prisma.produto.update({ where: { id: prod.id }, data: { unidadeId: alvo } });
    r.atualizados.push(`${nome} -> ${ab}`);
  }

  // 2) Criar os que faltam
  const categorias = await prisma.categoria.findMany();
  const catByName = new Map(categorias.map(c => [c.nome, c.id]));
  for (const novo of NOVOS_PRODUTOS) {
    const existe = await prisma.produto.findFirst({ where: { nome: novo.nome } });
    if (existe) { r.semMudanca.push(`${novo.nome} (ja existe)`); continue; }
    let categoriaId = catByName.get(novo.categoria);
    if (!categoriaId) {
      const c = await prisma.categoria.create({ data: { nome: novo.categoria } });
      categoriaId = c.id; catByName.set(novo.categoria, c.id);
    }
    const p = await prisma.produto.create({
      data: { nome: novo.nome, unidadeId: unidadeId(novo.unidade), categoriaId, estoqueMinimo: 0, ativo: true },
    });
    await prisma.estoque.create({ data: { produtoId: p.id, quantidade: 0 } });
    r.criados.push(`${novo.nome} [${novo.unidade}] / ${novo.categoria}${novo.unidadeDefinida ? '' : ' (unidade assumida)'}`);
  }

  return r;
}
