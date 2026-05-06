import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed SEMAE...');

  // Unidades de medida
  const uKg   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'kg'   }, update: {}, create: { nome: 'Quilograma',  abreviacao: 'kg'   } });
  const uG    = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'g'    }, update: {}, create: { nome: 'Grama',        abreviacao: 'g'    } });
  const uL    = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'L'    }, update: {}, create: { nome: 'Litro',        abreviacao: 'L'    } });
  const uMl   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'mL'   }, update: {}, create: { nome: 'Mililitro',    abreviacao: 'mL'   } });
  const uUn   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'un'   }, update: {}, create: { nome: 'Unidade',      abreviacao: 'un'   } });
  const uPct  = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'pct'  }, update: {}, create: { nome: 'Pacote',       abreviacao: 'pct'  } });
  const uCx   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'cx'   }, update: {}, create: { nome: 'Caixa',        abreviacao: 'cx'   } });
  const uFd   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'fd'   }, update: {}, create: { nome: 'Fardo',        abreviacao: 'fd'   } });
  const uLata = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'lata' }, update: {}, create: { nome: 'Lata',         abreviacao: 'lata' } });
  const uDz   = await prisma.unidadeMedida.upsert({ where: { abreviacao: 'dz'   }, update: {}, create: { nome: 'Dúzia',        abreviacao: 'dz'   } });
  void uG; void uMl; void uUn; void uCx; void uFd; void uDz;

  // Categorias
  const catGraos     = await prisma.categoria.upsert({ where: { nome: 'Grãos e Cereais'       }, update: {}, create: { nome: 'Grãos e Cereais',        cor: '#3B82F6' } });
  const catFarinhas  = await prisma.categoria.upsert({ where: { nome: 'Farinhas e Derivados'  }, update: {}, create: { nome: 'Farinhas e Derivados',   cor: '#F59E0B' } });
  const catAcucares  = await prisma.categoria.upsert({ where: { nome: 'Açúcares'              }, update: {}, create: { nome: 'Açúcares',               cor: '#EC4899' } });
  const catOleos     = await prisma.categoria.upsert({ where: { nome: 'Óleos e Condimentos'   }, update: {}, create: { nome: 'Óleos e Condimentos',    cor: '#10B981' } });
  const catLaticin   = await prisma.categoria.upsert({ where: { nome: 'Laticínios'            }, update: {}, create: { nome: 'Laticínios',             cor: '#8B5CF6' } });
  const catMassas    = await prisma.categoria.upsert({ where: { nome: 'Massas e Biscoitos'    }, update: {}, create: { nome: 'Massas e Biscoitos',     cor: '#F97316' } });
  const catConservas = await prisma.categoria.upsert({ where: { nome: 'Conservas'             }, update: {}, create: { nome: 'Conservas',              cor: '#6366F1' } });
  const catBebidas   = await prisma.categoria.upsert({ where: { nome: 'Bebidas e Achocolatados' }, update: {}, create: { nome: 'Bebidas e Achocolatados', cor: '#EF4444' } });
  await prisma.categoria.upsert({ where: { nome: 'Hortifruti'   }, update: {}, create: { nome: 'Hortifruti',   cor: '#22C55E' } });
  await prisma.categoria.upsert({ where: { nome: 'Carnes'       }, update: {}, create: { nome: 'Carnes',       cor: '#DC2626' } });
  const catOutros    = await prisma.categoria.upsert({ where: { nome: 'Outros'              }, update: {}, create: { nome: 'Outros',         cor: '#64748B' } });

  // Produtos
  const produtosData = [
    { nome: 'Açúcar',                       categoriaId: catAcucares.id,  unidadeId: uKg.id   },
    { nome: 'Amido de Milho',               categoriaId: catFarinhas.id,  unidadeId: uKg.id   },
    { nome: 'Arroz Parbolizado',            categoriaId: catGraos.id,     unidadeId: uKg.id   },
    { nome: 'Arroz Branco',                 categoriaId: catGraos.id,     unidadeId: uKg.id   },
    { nome: 'Achocolatado em Pó',           categoriaId: catBebidas.id,   unidadeId: uPct.id  },
    { nome: 'Azeite de Oliva',              categoriaId: catOleos.id,     unidadeId: uL.id    },
    { nome: 'Biscoito Doce',                categoriaId: catMassas.id,    unidadeId: uPct.id  },
    { nome: 'Biscoito Sal',                 categoriaId: catMassas.id,    unidadeId: uPct.id  },
    { nome: 'Café',                         categoriaId: catBebidas.id,   unidadeId: uPct.id  },
    { nome: 'Canela em Pó',                 categoriaId: catOleos.id,     unidadeId: uPct.id  },
    { nome: 'Canela em Lasca',              categoriaId: catOleos.id,     unidadeId: uPct.id  },
    { nome: 'Cremogema Morango',            categoriaId: catBebidas.id,   unidadeId: uPct.id  },
    { nome: 'Cremogema Tradicional',        categoriaId: catBebidas.id,   unidadeId: uPct.id  },
    { nome: 'Cremogema Chocolate',          categoriaId: catBebidas.id,   unidadeId: uPct.id  },
    { nome: 'Coco Ralado',                  categoriaId: catOutros.id,    unidadeId: uPct.id  },
    { nome: 'Creme de Leite',               categoriaId: catLaticin.id,   unidadeId: uLata.id },
    { nome: 'Ervilha',                      categoriaId: catConservas.id, unidadeId: uLata.id },
    { nome: 'Extrato de Tomate',            categoriaId: catConservas.id, unidadeId: uPct.id  },
    { nome: 'Farinha de Trigo Sem Fermento', categoriaId: catFarinhas.id, unidadeId: uKg.id   },
    { nome: 'Farinha de Trigo Com Fermento', categoriaId: catFarinhas.id, unidadeId: uKg.id   },
    { nome: 'Feijão Carioca',               categoriaId: catGraos.id,     unidadeId: uKg.id   },
    { nome: 'Feijão Preto',                 categoriaId: catGraos.id,     unidadeId: uKg.id   },
    { nome: 'Flocão de Milho',              categoriaId: catFarinhas.id,  unidadeId: uPct.id  },
    { nome: 'Fubá',                         categoriaId: catFarinhas.id,  unidadeId: uPct.id  },
    { nome: 'Leite em Pó',                  categoriaId: catLaticin.id,   unidadeId: uKg.id   },
    { nome: 'Leite Integral Líquido',       categoriaId: catLaticin.id,   unidadeId: uL.id    },
    { nome: 'Leite de Coco',                categoriaId: catLaticin.id,   unidadeId: uPct.id  },
    { nome: 'Leite Condensado',             categoriaId: catLaticin.id,   unidadeId: uLata.id },
    { nome: 'Macarrão de Sopa',             categoriaId: catMassas.id,    unidadeId: uPct.id  },
    { nome: 'Macarrão Espaguete',           categoriaId: catMassas.id,    unidadeId: uPct.id  },
    { nome: 'Macarrão Parafuso',            categoriaId: catMassas.id,    unidadeId: uPct.id  },
    { nome: 'Milho de Mungunzá',            categoriaId: catGraos.id,     unidadeId: uPct.id  },
    { nome: 'Milho de Pipoca',              categoriaId: catGraos.id,     unidadeId: uPct.id  },
    { nome: 'Milho Verde',                  categoriaId: catConservas.id, unidadeId: uLata.id },
    { nome: 'Molho de Tomate',              categoriaId: catConservas.id, unidadeId: uPct.id  },
    { nome: 'Óleo de Soja',                 categoriaId: catOleos.id,     unidadeId: uL.id    },
    { nome: 'Sal',                          categoriaId: catOleos.id,     unidadeId: uPct.id  },
    { nome: 'Vinagre',                      categoriaId: catOleos.id,     unidadeId: uL.id    },
  ];

  for (const p of produtosData) {
    const prod = await prisma.produto.upsert({
      where: { nome: p.nome },
      update: {},
      create: { nome: p.nome, categoriaId: p.categoriaId, unidadeId: p.unidadeId, estoqueMinimo: 0 },
    });
    await prisma.estoque.upsert({
      where: { produtoId: prod.id },
      update: {},
      create: { produtoId: prod.id, quantidade: 0 },
    });
  }
  console.log(`${produtosData.length} produtos criados.`);

  // Escolas
  await Promise.all([
    prisma.escola.upsert({ where: { nome: 'IESFA'                    }, update: {}, create: { nome: 'IESFA',                    tipo: 'ESCOLA'  } }),
    prisma.escola.upsert({ where: { nome: 'Creche Najara Rios'       }, update: {}, create: { nome: 'Creche Najara Rios',       tipo: 'CRECHE'  } }),
    prisma.escola.upsert({ where: { nome: 'Escola Municipal Centro'  }, update: {}, create: { nome: 'Escola Municipal Centro',  tipo: 'ESCOLA'  } }),
    prisma.escola.upsert({ where: { nome: 'Creche Municipal I'       }, update: {}, create: { nome: 'Creche Municipal I',       tipo: 'CRECHE'  } }),
    prisma.escola.upsert({ where: { nome: 'Escola Estadual Várzea'   }, update: {}, create: { nome: 'Escola Estadual Várzea',   tipo: 'ESCOLA'  } }),
  ]);
  console.log('Escolas criadas.');

  // Responsável padrão
  const resp = await prisma.responsavel.findFirst({ where: { nome: 'Responsável SEMAE' } });
  if (!resp) {
    await prisma.responsavel.create({ data: { nome: 'Responsável SEMAE', cargo: 'Coordenador(a)' } });
  }

  // Usuário admin
  const senhaHash = await bcrypt.hash('semae2024', 12);
  await prisma.usuario.upsert({
    where: { identificador: 'admin' },
    update: {},
    create: {
      identificador: 'admin',
      senhaHash,
      nome: 'Administrador SEMAE',
      role: 'admin',
      protegido: true,
    },
  });
  console.log('Usuário admin criado (senha: semae2024).');
  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
