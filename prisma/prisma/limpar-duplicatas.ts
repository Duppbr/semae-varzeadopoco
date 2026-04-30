import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Encontra todos os pares (categoria, valor) duplicados
  const duplicados = await prisma.opcao.groupBy({
    by: ['categoria', 'valor'],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  for (const dup of duplicados) {
    // Busca todos os registros com esse par, ordena pelo id (mantendo o menor)
    const registros = await prisma.opcao.findMany({
      where: { categoria: dup.categoria, valor: dup.valor },
      orderBy: { id: 'asc' },
    });
    const [manter, ...excluir] = registros;
    for (const r of excluir) {
      await prisma.opcao.delete({ where: { id: r.id } });
      console.log(`Removido duplicado: id=${r.id}, categoria=${r.categoria}, valor=${r.valor}`);
    }
  }
  console.log('Limpeza concluída.');
}

main().catch(console.error).finally(() => prisma.$disconnect());