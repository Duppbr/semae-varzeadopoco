import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const atalhos = [
    { posicao: 1, amperagem: '60ah', tipo: 'Convencional' },
    { posicao: 2, amperagem: '60ah', tipo: 'EFB' },
    { posicao: 3, amperagem: '60ah', tipo: 'AGM' },
    { posicao: 4, amperagem: '75ah', tipo: 'EFB' },
    { posicao: 5, amperagem: '90ah', tipo: 'AGM' },
    { posicao: 6, amperagem: '100ah', tipo: 'AGM' },
  ];

  for (const a of atalhos) {
    await prisma.atalho.create({ data: a });
  }
  console.log('Atalhos criados.');
}

main().catch(console.error).finally(() => prisma.$disconnect());