-- Atualizacao aditiva para bases existentes sem historico Prisma Migrate.
-- Fazer backup antes de aplicar. Pode ser reaplicada sem duplicar o historico legado.
BEGIN;
ALTER TABLE "Entrada" ADD COLUMN IF NOT EXISTS "pedidoId" TEXT;
ALTER TABLE "Entrada" ADD COLUMN IF NOT EXISTS "chaveOperacao" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Entrada_chaveOperacao_key" ON "Entrada"("chaveOperacao");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Entrada_pedidoId_fkey') THEN
    ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "ItemPedido" ALTER COLUMN "produtoId" DROP NOT NULL;
ALTER TABLE "ItemPedido" ADD COLUMN IF NOT EXISTS "descricao" TEXT;
ALTER TABLE "ItemPedido" ADD COLUMN IF NOT EXISTS "recebido" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "ItemPedido" ADD COLUMN IF NOT EXISTS "cancelado" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "MovimentoEstoque" (
  "id" TEXT PRIMARY KEY,
  "produtoId" TEXT NOT NULL,
  "produtoNome" TEXT NOT NULL,
  "unidade" TEXT NOT NULL,
  "quantidade" DOUBLE PRECISION NOT NULL,
  "saldo" DOUBLE PRECISION,
  "chaveOrigem" TEXT,
  "tipo" TEXT NOT NULL,
  "origemId" TEXT NOT NULL,
  "numero" INTEGER,
  "pedidoId" TEXT,
  "data" TIMESTAMP(3) NOT NULL,
  "motivo" TEXT,
  "usuarioNome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "MovimentoEstoque_chaveOrigem_key" ON "MovimentoEstoque"("chaveOrigem");
CREATE INDEX IF NOT EXISTS "MovimentoEstoque_produtoId_createdAt_idx" ON "MovimentoEstoque"("produtoId", "createdAt");
CREATE INDEX IF NOT EXISTS "MovimentoEstoque_origemId_idx" ON "MovimentoEstoque"("origemId");
CREATE INDEX IF NOT EXISTS "MovimentoEstoque_pedidoId_idx" ON "MovimentoEstoque"("pedidoId");

-- Importa documentos que ainda existem. Nao inventa saldo ou autor historico.
-- Cancelamentos antigos podem nao ter sido estornados pelo codigo anterior;
-- nao altera o saldo automaticamente sem conferencia operacional.
INSERT INTO "MovimentoEstoque" ("id", "chaveOrigem", "produtoId", "produtoNome", "unidade", "quantidade", "tipo", "origemId", "numero", "data", "createdAt", "usuarioNome", "motivo")
SELECT 'legado-entrada-' || i.id, 'legado-entrada-' || i.id, i."produtoId", p.nome, u.abreviacao, i.quantidade, 'entrada', d.id, d.numero, d.data, d."createdAt", 'Legado (autor nao apurado)', 'Importado do documento anterior ao historico'
FROM "ItemEntrada" i JOIN "Entrada" d ON d.id = i."entradaId" JOIN "Produto" p ON p.id = i."produtoId" JOIN "UnidadeMedida" u ON u.id = i."unidadeId"
WHERE NOT EXISTS (SELECT 1 FROM "MovimentoEstoque" m WHERE m."origemId" = d.id AND m."produtoId" = i."produtoId")
ON CONFLICT DO NOTHING;
INSERT INTO "MovimentoEstoque" ("id", "chaveOrigem", "produtoId", "produtoNome", "unidade", "quantidade", "tipo", "origemId", "numero", "data", "createdAt", "usuarioNome", "motivo")
SELECT 'legado-saida-' || i.id, 'legado-saida-' || i.id, i."produtoId", p.nome, u.abreviacao, -i.quantidade, 'saida', d.id, d.numero, d.data, d."createdAt", 'Legado (autor nao apurado)', 'Importado. Status original: ' || d.status
FROM "ItemSaida" i JOIN "Saida" d ON d.id = i."saidaId" JOIN "Produto" p ON p.id = i."produtoId" JOIN "UnidadeMedida" u ON u.id = i."unidadeId"
WHERE NOT EXISTS (SELECT 1 FROM "MovimentoEstoque" m WHERE m."origemId" = d.id AND m."produtoId" = i."produtoId")
ON CONFLICT DO NOTHING;
INSERT INTO "MovimentoEstoque" ("id", "chaveOrigem", "produtoId", "produtoNome", "unidade", "quantidade", "tipo", "origemId", "numero", "data", "createdAt", "usuarioNome", "motivo")
SELECT 'legado-descarte-' || i.id, 'legado-descarte-' || i.id, i."produtoId", p.nome, u.abreviacao, -i.quantidade, 'descarte', d.id, d.numero, d.data, d."createdAt", 'Legado (autor nao apurado)', d.motivo
FROM "ItemDescarte" i JOIN "Descarte" d ON d.id = i."descarteId" JOIN "Produto" p ON p.id = i."produtoId" JOIN "UnidadeMedida" u ON u.id = i."unidadeId"
WHERE NOT EXISTS (SELECT 1 FROM "MovimentoEstoque" m WHERE m."origemId" = d.id AND m."produtoId" = i."produtoId")
ON CONFLICT DO NOTHING;
COMMIT;
