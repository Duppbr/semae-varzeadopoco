import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Ajusta tipos na tabela AplicacaoVeiculo
  const result1 = await prisma.aplicacaoVeiculo.updateMany({
    where: { tipo: { in: ['CONVENCIONAL', 'convencional'] } },
    data: { tipo: 'Convencional' },
  });
  console.log(`AplicacaoVeiculo: ${result1.count} registros atualizados.`);

  // Ajusta tipos na tabela Produto (se houver)
  const result2 = await prisma.produto.updateMany({
    where: { tipo: { in: ['CONVENCIONAL', 'convencional'] } },
    data: { tipo: 'Convencional' },
  });
  console.log(`Produto: ${result2.count} registros atualizados.`);

  // Garante que a opção "Convencional" exista na tabela Opcao
  await prisma.opcao.upsert({
    where: { categoria_valor: { categoria: 'tipo', valor: 'Convencional' } },
    update: {},
    create: { categoria: 'tipo', valor: 'Convencional' },
  });
  console.log('Opção "Convencional" garantida.');
}

main().catch(console.error).finally(() => prisma.$disconnect());