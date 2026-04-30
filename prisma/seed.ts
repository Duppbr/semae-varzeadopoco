import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed limpo...');

  // 1. Cria as lojas
  const matriz = await prisma.loja.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nome: 'Matriz Artêmia' },
  });
  const filial = await prisma.loja.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, nome: 'Filial Iguatemi' },
  });
  console.log('Lojas criadas.');

  // 2. Cria o usuário admin (senha: admin123)
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { identificador: 'admin' },
    update: {},
    create: {
      identificador: 'admin',
      senhaHash: adminHash,
      nome: 'Administrador',
      role: 'admin',
      lojaId: matriz.id,
      ativo: true,
    },
  });
  console.log('Usuário admin criado.');

  // 3. Opções iniciais (marcas, amperagens, tipos, garantias)
  const opcoes = [
    // Marcas
    { categoria: 'marca', valor: 'ACDELCO' },
    { categoria: 'marca', valor: 'CRAL' },
    { categoria: 'marca', valor: 'Pioneiro' },
    { categoria: 'marca', valor: 'Moura' },
    { categoria: 'marca', valor: 'Bosh' },
    { categoria: 'marca', valor: 'Heliar' },
    // Amperagens
    { categoria: 'amperagem', valor: '38ah' },
    { categoria: 'amperagem', valor: '45ah' },
    { categoria: 'amperagem', valor: '60ah' },
    { categoria: 'amperagem', valor: '75ah' },
    { categoria: 'amperagem', valor: '90ah' },
    { categoria: 'amperagem', valor: '100ah' },
    // Tipos
    { categoria: 'tipo', valor: 'Convencional' },
    { categoria: 'tipo', valor: 'EFB' },
    { categoria: 'tipo', valor: 'AGM' },
    // Garantias
    { categoria: 'garantia', valor: '12 meses' },
    { categoria: 'garantia', valor: '24 meses' },
    { categoria: 'garantia', valor: '36 meses' },
    { categoria: 'garantia', valor: '2 anos' },
    { categoria: 'garantia', valor: '5 anos' },
  ];

  for (const op of opcoes) {
    await prisma.opcao.upsert({
      where: { categoria_valor: { categoria: op.categoria, valor: op.valor } },
      update: {},
      create: op,
    });
  }
  console.log('Opções cadastradas.');

  console.log('✅ Seed concluído!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());