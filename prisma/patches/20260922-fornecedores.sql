-- Cadastro de fornecedores e vinculo com pedidos e entradas.
-- Atualizacao aditiva para bases existentes sem historico Prisma Migrate.
-- Fazer backup antes de aplicar. Pode ser reaplicada sem duplicar dados.
BEGIN;

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

ALTER TABLE "PedidoCompra" ADD COLUMN IF NOT EXISTS "fornecedorId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PedidoCompra_fornecedorId_fkey') THEN
    ALTER TABLE "PedidoCompra" ADD CONSTRAINT "PedidoCompra_fornecedorId_fkey"
      FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- O texto livre digitado na entrada vira "fornecedorNome" e continua guardado como historico.
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

-- Cadastra os fornecedores que so existiam como texto nas entradas antigas e liga as entradas a eles.
-- Nomes iguais (ignorando espacos e maiusculas) viram um unico cadastro.
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

-- Religa tambem os pedidos antigos: quando todas as entradas de um pedido vieram
-- do mesmo fornecedor, esse e o fornecedor do pedido. Pedido recebido de mais de
-- um fornecedor fica sem vinculo, porque nao da para escolher um sem inventar.
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
