-- ============================================================================
-- CADASTRO DE FORNECEDORES - atualizacao do banco de dados
-- Sistema SEMAE - Alimentacao Escolar - 22/09/2026
-- (sem acentos de proposito, para nao embaralhar em editor do Windows)
-- ============================================================================
--
-- O QUE E ESTE ARQUIVO
--
-- Este projeto nao usa migrations automaticas: toda mudanca no banco vem em um
-- arquivo como este, que voce roda a mao no Supabase. O site NAO faz isso
-- sozinho no deploy.
--
-- Este arquivo prepara o banco para a tela nova de Fornecedores. Antes, o
-- fornecedor era so um nome digitado a mao em cada entrada de mercadoria, e o
-- pedido de compra nao tinha fornecedor nenhum. Depois deste arquivo, existe um
-- cadastro de empresas, e pedidos e entradas apontam para ele.
--
-- QUANDO RODAR
--
-- ANTES de publicar a versao nova do site. Se o site novo subir primeiro, a
-- tela de Fornecedores da erro, porque a tabela ainda nao existe no banco.
--
-- O QUE ELE FAZ, NA ORDEM
--
--   1. Cria a tabela "Fornecedor" (nome da empresa, CNPJ, contato, telefone,
--      e-mail, endereco, observacao e se esta ativo). Dois fornecedores nao
--      podem ter o mesmo nome.
--   2. Cria o campo de fornecedor no pedido de compra.
--   3. Renomeia o campo antigo "fornecedor" da entrada para "fornecedorNome" e
--      cria o campo novo, que aponta para o cadastro. O texto que ja estava
--      digitado NAO e apagado: continua guardado em "fornecedorNome".
--   4. Cadastra automaticamente as empresas que so existiam como texto nas
--      entradas antigas, e liga essas entradas ao cadastro novo. Se a mesma
--      empresa foi escrita de formas diferentes ("Distribuidora Central" e
--      "  distribuidora central "), vira um cadastro so.
--   5. Preenche o fornecedor dos pedidos antigos, deduzindo de quem entregou:
--      se todas as entregas daquele pedido vieram da mesma empresa, e ela.
--
-- O QUE ELE NAO FAZ
--
--   - Nao apaga nem altera nenhum pedido, entrada, saida, produto ou saldo de
--     estoque. So acrescenta campos e preenche os que estao vazios.
--   - Nao inventa fornecedor: pedido que recebeu de duas empresas diferentes, e
--     pedido que nunca teve entrega, ficam sem empresa. Voce preenche a mao
--     depois, se quiser.
--   - Nao mexe no site. Publicar a versao nova e um passo separado.
--
-- SEGURANCA
--
--   - Tudo roda dentro de uma transacao (BEGIN/COMMIT): ou vai tudo, ou nao vai
--     nada. Se der erro no meio, o banco fica como estava.
--   - Pode ser rodado duas vezes sem estragar nada nem duplicar empresas.
--   - Mesmo assim, FACA BACKUP ANTES. E confira que esta conectado no banco
--     certo antes de executar.
--
-- COMO RODAR
--
--   Pelo painel do Supabase: SQL Editor > New query > cole este arquivo inteiro
--   > Run. Depois disso, publique a versao nova do site.
--
--   Ou pelo computador, conferindo antes o destino do DATABASE_URL:
--   node --env-file=.env.local node_modules/prisma/build/index.js db execute \
--     --schema prisma/schema.prisma \
--     --file prisma/patches/20260922-fornecedores.sql
--
-- ============================================================================

BEGIN;

-- PASSO 1 - a tabela do cadastro de fornecedores.
-- So "nome" e obrigatorio; o resto pode ficar em branco e some do documento.

CREATE TABLE IF NOT EXISTS "Fornecedor" (
  "id" TEXT PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "cnpj" TEXT,
  "telefone" TEXT,
  "email" TEXT,
  "endereco" TEXT,
  "contato" TEXT,
  "observacao" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Fornecedor_nome_key" ON "Fornecedor"("nome");

-- PASSO 2 - o pedido de compra passa a apontar para uma empresa.
-- Fica opcional para nao invalidar os pedidos que ja existem.
ALTER TABLE "PedidoCompra" ADD COLUMN IF NOT EXISTS "fornecedorId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoCompra_fornecedorId_fkey') THEN
    ALTER TABLE "PedidoCompra" ADD CONSTRAINT "PedidoCompra_fornecedorId_fkey"
      FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- PASSO 3 - a entrada de mercadoria tambem passa a apontar para o cadastro.
-- O nome que foi digitado a mao nas entradas antigas nao se perde: o campo
-- antigo so muda de nome, para "fornecedorNome", e continua com o texto.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entrada' AND column_name = 'fornecedor')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Entrada' AND column_name = 'fornecedorNome') THEN
    ALTER TABLE "Entrada" RENAME COLUMN "fornecedor" TO "fornecedorNome";
  END IF;
END $$;
ALTER TABLE "Entrada" ADD COLUMN IF NOT EXISTS "fornecedorNome" TEXT;
ALTER TABLE "Entrada" ADD COLUMN IF NOT EXISTS "fornecedorId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Entrada_fornecedorId_fkey') THEN
    ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_fornecedorId_fkey"
      FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- PASSO 4 - cadastra as empresas que so existiam como texto e liga as entradas.
-- Nomes iguais, ignorando espacos sobrando e maiusculas/minusculas, viram um
-- cadastro so. Entrada sem fornecedor digitado continua sem empresa.
INSERT INTO "Fornecedor" ("id", "nome", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, nome, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (lower(btrim("fornecedorNome"))) btrim("fornecedorNome") AS nome
  FROM "Entrada"
  WHERE "fornecedorNome" IS NOT NULL AND btrim("fornecedorNome") <> ''
  ORDER BY lower(btrim("fornecedorNome")), btrim("fornecedorNome")
) AS nomes
WHERE NOT EXISTS (SELECT 1 FROM "Fornecedor" f WHERE lower(f."nome") = lower(nomes.nome));

UPDATE "Entrada" e
SET "fornecedorId" = f."id"
FROM "Fornecedor" f
WHERE e."fornecedorId" IS NULL
  AND e."fornecedorNome" IS NOT NULL
  AND lower(btrim(e."fornecedorNome")) = lower(f."nome");

-- PASSO 5 - preenche a empresa dos pedidos antigos.
-- O pedido antigo nao guardava fornecedor, entao deduzimos de quem entregou:
-- se todas as entregas do pedido vieram da mesma empresa, essa e a empresa do
-- pedido. Se vieram de empresas diferentes, o pedido fica sem empresa - escolher
-- uma seria inventar o dado. Pedido que nunca teve entrega tambem fica sem.
UPDATE "PedidoCompra" p
SET "fornecedorId" = origem."fornecedorId"
FROM (
  SELECT e."pedidoId", MIN(e."fornecedorId") AS "fornecedorId"
  FROM "Entrada" e
  WHERE e."pedidoId" IS NOT NULL AND e."fornecedorId" IS NOT NULL
  GROUP BY e."pedidoId"
  HAVING COUNT(DISTINCT e."fornecedorId") = 1
) AS origem
WHERE p."id" = origem."pedidoId" AND p."fornecedorId" IS NULL;

COMMIT;
