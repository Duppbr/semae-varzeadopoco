import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Pega todos os valores distintos de marca, amperagem e tipo dos produtos atuais
  const marcas = await prisma.produto.findMany({
    select: { marca: true },
    distinct: ['marca'],
  });
  const amperagens = await prisma.produto.findMany({
    select: { amperagem: true },
    distinct: ['amperagem'],
  });
  const tipos = await prisma.produto.findMany({
    select: { tipo: true },
    distinct: ['tipo'],
  });

  // Insere na tabela Opcao (ignora duplicatas com upsert ou verificação)
  for (const { marca } of marcas) {
    if (marca) {
      await prisma.opcao.upsert({
        where: { categoria_valor: { categoria: 'marca', valor: marca } },
        update: {},
        create: { categoria: 'marca', valor: marca },
      });
    }
  }
  for (const { amperagem } of amperagens) {
    if (amperagem) {
      await prisma.opcao.upsert({
        where: { categoria_valor: { categoria: 'amperagem', valor: amperagem } },
        update: {},
        create: { categoria: 'amperagem', valor: amperagem },
      });
    }
  }
  for (const { tipo } of tipos) {
    if (tipo) {
      await prisma.opcao.upsert({
        where: { categoria_valor: { categoria: 'tipo', valor: tipo } },
        update: {},
        create: { categoria: 'tipo', valor: tipo },
      });
    }
  }

  console.log('Opções importadas com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());