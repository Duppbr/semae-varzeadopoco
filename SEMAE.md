# SEMAE – Sistema de Gestão de Alimentação Escolar

**Prefeitura Municipal de Várzea do Poço – BA**

Sistema web + Android para controle de estoque, distribuição de merenda para escolas, descartes e pedidos de compra.

**Revisão de 15/09/2026:** as correções desta rodada estão no código local. Antes de publicar, aplicar a atualização aditiva do banco descrita em [Entrega e validação](#entrega-e-validação). O APK novo sozinho não atualiza o servidor nem o banco.

---

## Índice

1. [Stack Tecnológica](#stack-tecnológica)
2. [Módulos e Rotas](#módulos-e-rotas)
3. [API REST](#api-rest)
4. [Banco de Dados](#banco-de-dados)
5. [Componentes e Libs](#componentes-e-libs)
6. [Documentos PDF](#documentos-pdf)
7. [Configuração do Ambiente](#configuração-do-ambiente)
8. [Como Rodar Localmente](#como-rodar-localmente)
9. [Scripts Utilitários](#scripts-utilitários)
10. [Deploy – Vercel](#deploy--vercel)
11. [App Android – Capacitor](#app-android--capacitor)
12. [Build APK – GitHub Actions](#build-apk--github-actions)
13. [PWA / Offline](#pwa--offline)
14. [Segurança](#segurança)
15. [Regras de Negócio](#regras-de-negócio)
16. [Decisões Técnicas](#decisões-técnicas)
17. [Entrega e validação](#entrega-e-validação)

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework web | Next.js (App Router) | 16.3.5 |
| UI | React | 19.2.4 |
| Linguagem | TypeScript | 5 |
| Estilo | Tailwind CSS | v4 |
| ORM | Prisma | 6.19.3 |
| Banco | PostgreSQL via Supabase | — |
| Sessão | iron-session (cookie HTTP-only) | — |
| Senhas | bcryptjs | — |
| Ícones | lucide-react | — |
| Mobile | Capacitor Android | 8.3.1 |
| Deploy web | Vercel | — |
| CI/CD APK | GitHub Actions | — |

---

## Módulos e Rotas

### Públicas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | Autenticação por usuário e senha |

### App (requer login)

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `src/app/page.tsx` | Redireciona para `/dashboard` ou `/login` |
| `/dashboard` | `src/app/dashboard/page.tsx` | Indicadores gerais, alertas de estoque baixo, últimas movimentações |
| `/estoque` | `src/app/estoque/page.tsx` | Consulta e ajuste manual de estoque com auditoria |
| `/entrada` | `src/app/entrada/page.tsx` | Lista com acesso ao detalhe de cada entrada |
| `/entrada/[id]` e `/entrada/[id]/pdf` | `src/app/entrada/[id]/` | Itens, origem do pedido, histórico e PDF |
| `/estoque/[id]` | `src/app/estoque/[id]/page.tsx` | Saldo e histórico por produto |
| `/entrada/nova` | `src/app/entrada/nova/page.tsx` | Formulário de nova entrada de mercadoria |
| `/saida` | `src/app/saida/page.tsx` | Lista de saídas com filtro por status |
| `/saida/nova` | `src/app/saida/nova/page.tsx` | Formulário de nova saída para escola |
| `/saida/[id]` | `src/app/saida/[id]/page.tsx` | Detalhe da saída com opção de editar status |
| `/saida/[id]/pdf` | `src/app/saida/[id]/pdf/page.tsx` | PDF da saída – Controle de Saída de Mercadorias |
| `/descarte` | `src/app/descarte/page.tsx` | Lista de descartes |
| `/descarte/[id]` e `/descarte/[id]/pdf` | `src/app/descarte/[id]/` | Itens, motivo, histórico e PDF |
| `/descarte/novo` | `src/app/descarte/novo/page.tsx` | Formulário de novo descarte |
| `/pedido-compra` | `src/app/pedido-compra/page.tsx` | Lista de pedidos de compra com filtro de status |
| `/pedido-compra/novo` | `src/app/pedido-compra/novo/page.tsx` | Formulário de novo pedido |
| `/pedido-compra/[id]` | `src/app/pedido-compra/[id]/page.tsx` | Detalhe e edição do pedido |
| `/pedido-compra/[id]/pdf` | `src/app/pedido-compra/[id]/pdf/page.tsx` | PDF do pedido de compra |
| `/relatorios` | `src/app/relatorios/page.tsx` | 6 tipos de relatório com filtro de período |

### Administração (role `admin`)

| Rota | Descrição |
|---|---|
| `/admin` | Painel com atalhos para todos os cadastros |
| `/admin/produtos` | CRUD de produtos |
| `/admin/escolas` | CRUD de escolas e creches |
| `/admin/fornecedores` | CRUD de fornecedores (empresas para quem o pedido é enviado) |
| `/admin/responsaveis` | CRUD de responsáveis SEMAE |
| `/admin/unidades` | CRUD de unidades de medida |
| `/admin/categorias` | CRUD de categorias de produto |
| `/admin/usuarios` | CRUD de usuários do sistema |

---

## API REST

Todas as rotas exigem sessão válida (cookie `semae-session`), exceto `/api/auth/login`.
Respostas com CORS configurado para origens mobile via `src/lib/cors-mobile.ts`.

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Login: `{ identificador, senha }` → seta cookie de sessão |
| `POST` | `/api/auth/logout` | Logout: destrói a sessão |
| `GET` | `/api/auth/me` | Retorna dados da sessão: `{ isLoggedIn, id, nome, role, ... }` |

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/dashboard` | Totais de produtos, estoque, entradas/saídas do dia, alertas de estoque baixo, últimas saídas |

### Estoque

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/estoque` | Lista produtos com quantidade atual; aceita `?search=` |
| `GET` | `/api/historico?produtoId=...` | Histórico paginado de um produto; `origemId` consulta um documento |
| `PUT` | `/api/estoque/[id]` | Ajuste manual de quantidade (requer motivo; gera auditoria) |

### Entradas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/entrada` | Lista entradas; aceita `?limit=&offset=` |
| `POST` | `/api/entrada` | Cria entrada; incrementa estoque automaticamente |
| `GET` | `/api/entrada/[id]` | Detalhe da entrada |
| `PUT` | `/api/entrada/[id]` | Atualiza entrada |
| `DELETE` | `/api/entrada/[id]` | Remove entrada |

### Saídas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/saida` | Lista saídas; aceita `?status=&escolaId=&limit=&offset=` |
| `POST` | `/api/saida` | Cria saída; decrementa estoque (permite negativo) |
| `GET` | `/api/saida/[id]` | Detalhe da saída |
| `PUT` | `/api/saida/[id]` | Atualiza status da saída |
| `DELETE` | `/api/saida/[id]` | Remove saída |

### Descartes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/descarte` | Lista descartes; aceita `?limit=&offset=` |
| `POST` | `/api/descarte` | Cria descarte; decrementa estoque |
| `GET` | `/api/descarte/[id]` | Detalhe do descarte |
| `PUT` | `/api/descarte/[id]` | Atualiza descarte |
| `DELETE` | `/api/descarte/[id]` | Remove descarte |

### Pedidos de Compra

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/pedido-compra` | Lista pedidos; aceita `?status=&limit=&offset=` |
| `POST` | `/api/pedido-compra` | Cria pedido |
| `GET` | `/api/pedido-compra/[id]` | Detalhe do pedido |
| `PUT` | `/api/pedido-compra/[id]` | Atualiza pedido e status |
| `DELETE` | `/api/pedido-compra/[id]` | Cancela pedido |

### Relatórios

| Método | Rota | Parâmetros |
|---|---|---|
| `GET` | `/api/relatorios` | `?tipo=&periodo=&escolaId=&categoriaId=&dataInicio=&dataFim=` |

Tipos disponíveis:
- `produtos-mais-usados` – top produtos por quantidade saída
- `produtos-mais-descartados` – top produtos descartados
- `produtos-mais-comprados` – top produtos em pedidos
- `saidas-por-escola` – total entregue por escola
- `movimentacao-periodo` – resumo diário de entradas/saídas/descartes
- `estoque-atual` – inventário atual por produto

### Cadastros Auxiliares

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/escolas` | Lista escolas ativas; aceita `?ativo=true` |
| `GET` | `/api/responsaveis` | Lista responsáveis ativos; aceita `?ativo=true` |
| `GET` | `/api/fornecedores` | Lista fornecedores; aceita `?ativo=true` |

### Administração (role `admin`)

CRUD completo (GET lista, POST cria, GET/PUT/DELETE por `[id]`) em:

- `/api/admin/produtos`
- `/api/admin/escolas`
- `/api/admin/fornecedores`
- `/api/admin/responsaveis`
- `/api/admin/unidades`
- `/api/admin/categorias`
- `/api/admin/usuarios`

---

## Banco de Dados

**Provider**: PostgreSQL (Supabase)
**ORM**: Prisma 6
**Schema**: `prisma/schema.prisma`

### Modelos

#### Dados Mestre

```
Escola          id, nome*, tipo, endereco, telefone, ativo, createdAt, updatedAt
                → saidas[], pedidos[]

Categoria       id, nome*, cor
                → produtos[]

UnidadeMedida   id, nome*, abreviacao*
                → produtos[], itensEntrada[], itensSaida[], itensDescarte[], itensPedido[]

Produto         id, nome*, categoriaId, unidadeId, estoqueMinimo, ativo, createdAt, updatedAt
                → categoria, unidade, estoque, itensEntrada[], itensSaida[], ...

Estoque         id, produtoId*, quantidade, updatedAt
                → produto

Responsavel     id, nome, cargo, ativo, createdAt, updatedAt
                → entradas[], saidas[], descartes[], pedidos[]

Fornecedor      id, nome*, cnpj, telefone, email, endereco, contato, observacao, ativo,
                createdAt, updatedAt
                → pedidos[], entradas[]
                Só `nome` é obrigatório; campos vazios são omitidos do documento do pedido.
```

#### Movimentações

```
Entrada         id, numero*autoincr, data, responsavelId, fornecedorId, fornecedorNome,
                observacao, createdAt
                → responsavel, fornecedor, itens[]
                `fornecedorNome` guarda o texto digitado nas entradas anteriores ao cadastro.

ItemEntrada     id, entradaId[CASCADE], produtoId, quantidade, unidadeId

Saida           id, numero*autoincr, data, escolaId, responsavelId, recebedor, observacao,
                status[PENDENTE|ENTREGUE|CANCELADO], createdAt
                → escola, responsavel, itens[]

ItemSaida       id, saidaId[CASCADE], produtoId, quantidade, unidadeId

Descarte        id, numero*autoincr, data, responsavelId, motivo, observacao, createdAt
                → responsavel, itens[]

ItemDescarte    id, descarteId[CASCADE], produtoId, quantidade, unidadeId

PedidoCompra    id, numero*autoincr, data, escolaId, responsavelId, fornecedorId,
                observacao, status[RASCUNHO|ENVIADO|ATENDIDO|CANCELADO], createdAt
                → escola, responsavel, fornecedor, itens[]
                `fornecedorId` é opcional no banco para não invalidar pedidos anteriores;
                a tela de novo pedido exige o fornecedor.

ItemPedido      id, pedidoId[CASCADE], produtoId, quantidade, unidadeId
```

#### Segurança

```
Usuario         id, identificador*, senhaHash, nome, role[funcionario|admin],
                ativo, protegido, createdAt
                → auditorias[]

Auditoria       id, usuarioId[SetNull], usuarioNome, usuarioIdentificador, acao,
                entidade, entidadeId, status[sucesso|erro], resumo, detalhes[JSON],
                ip, userAgent, createdAt
                índices: usuarioId, acao, entidade, status, createdAt
```

`*` = campo único no banco.

### Conexão Supabase

Usar o pooler em **modo transação** (porta 6543) — compatível com Vercel serverless:

```env
DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

Não usar porta 5432 (modo sessão) em produção — esgota o pool de conexões do free tier.

---

## Componentes e Libs

### `src/components/AppShell.tsx`

Wrapper de layout para todas as páginas autenticadas.

Props: `title`, `backHref?`, `actions?`, `noPadding?`, `children`

- Header fixo com botão voltar, título e ações
- Logout via `POST /api/auth/logout`
- `<TabBar />` na parte inferior
- Padding seguro para notch/status bar

### `src/components/TabBar.tsx`

Barra de navegação inferior com 4 abas fixas + menu "Mais" (bottom sheet).

| Aba | Rota |
|---|---|
| Início | `/dashboard` |
| Saída | `/saida` |
| Entrada | `/entrada` |
| Estoque | `/estoque` |

Menu "Mais": Descarte, Pedido de Compra, Relatórios, Administração.

### `src/components/ServiceWorkerRegister.tsx`

Client component que registra `/sw.js` ao montar. Importado no `src/app/layout.tsx`.

### PDF e operações compartilhadas

- `src/components/PdfActions.tsx`: Client Component com eventos React, registro do plugin Capacitor e mensagens de erro.
- `src/components/PaginaDocumento.tsx`: autenticação, consulta e normalização dos documentos no servidor.
- `src/components/DocumentoImprimivel.tsx`: visualização HTML e impressão A4, sem duplicar `html`/`body`.
- `src/lib/gerar-pdf.ts`: arquivo PDF real com jsPDF/AutoTable, texto selecionável e múltiplas páginas.
- `src/lib/operacoes.ts`: validação, transações de estoque, cancelamentos, estornos e auditoria.
- `src/lib/pedidos.ts`: pedidos, itens sem cadastro e recebimentos parciais idempotentes.
- `src/lib/regras.ts`: regra única de estoque baixo, quantidades pendentes e datas civis.
- `src/components/Historico.tsx`: movimentações e eventos dos documentos.

O helper antigo `pdf-actions.ts` foi removido: scripts inseridos como HTML não são uma base confiável para ações após navegação React.

---

## Documentos PDF

### Rotas

| Rota | Documento |
|---|---|
| `/saida/[id]/pdf` | Controle de Saída de Mercadorias |
| `/pedido-compra/[id]/pdf` | Pedido de Compra |
| `/entrada/[id]/pdf` | Comprovante de entrada |
| `/descarte/[id]/pdf` | Comprovante de descarte |

Todas verificam a sessão no servidor antes de buscar dados. São páginas React normais; somente os controles interativos rodam no cliente. O layout raiz é o único responsável por `html` e `body`.

### Layout e paginação

Modelo comum com identificação SEMAE, dados do documento, tabela e assinaturas. Itens ordenados por nome. O arquivo baixado usa AutoTable para repetir cabeçalhos e distribuir itens em páginas A4, sem prometer que qualquer quantidade caiba em uma folha. A visualização HTML usa CSS de impressão; seu layout pode diferir do PDF binário, mas utiliza os mesmos dados.

O logo `public/logo-semae.png` aparece na visualização e é incorporado ao arquivo quando carregado. Teste automatizado cobre um documento com 150 itens.

### Botões de ação (barra sticky no topo)

Controles: Voltar, Compartilhar, PDF e Imprimir.

- Barra `position: sticky; top: 0` — sempre visível, nunca sobreposta ao conteúdo
- Oculta no `@media print`
- Eventos React em Client Component. Os links para PDF permanecem na mesma WebView.
- Compartilhar envia o **arquivo**, não um link que exigiria login do destinatário.
- Browser sem compartilhamento de arquivos baixa o PDF. No Android, PDF abre o seletor nativo para salvar/enviar.
- Falhas exibem mensagem; imprimir não muda silenciosamente para compartilhar.

### Plugin nativo Android – `SemaePdfPlugin`

Arquivo: `android/app/src/main/java/com/semae/varzeadopoco/SemaePdfPlugin.java`

| Método | O que faz |
|---|---|
| `print(title)` | Chama `WebView.createPrintDocumentAdapter()` + `PrintManager` do Android — abre o diálogo de impressão nativo |
| `sharePdf(base64, filename)` | Valida PDF e tamanho, grava em cache privado e envia `application/pdf` com `FileProvider` e permissão temporária de leitura |
| `share(...)` | Compatibilidade com a versão web anterior; não é usado pelos novos controles |

Registrado em `MainActivity.java` via `registerPlugin(SemaePdfPlugin.class)`.

> **Importante:** alterações no plugin exigem novo APK. O Vercel deploy não atualiza código nativo.

### `@page { size: A4 }`

Solicita A4 na visualização HTML. Configurações finais dependem do diálogo de impressão e do serviço instalado. O arquivo gerado por jsPDF é A4.

---

## Configuração do Ambiente

Arquivo `.env.local` (nunca versionar):

```env
# Supabase – pooler modo transação (porta 6543)
DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Mínimo 32 caracteres – iron-session
SECRET_COOKIE_PASSWORD="gere-um-segredo-aleatorio-com-32-chars"
```

Opcionais:

```env
ADMIN_SEED_PASSWORD="senha-forte-para-o-admin-inicial"
ALLOWED_MOBILE_ORIGINS="https://semae-varzeadopoco.vercel.app"
```

As mesmas variáveis devem estar no painel do Vercel em **Settings → Environment Variables**.

---

## Como Rodar Localmente

### Teste isolado, sem tocar na produção (recomendado)

No Windows, dê dois cliques em **`testar-local.bat`**. Ele instala o que falta na
primeira vez, prepara o banco e abre o navegador sozinho.

Em outros sistemas: `npm run preview:local`.

Sobe um PostgreSQL em memória com o schema atual, popula dados fictícios
(catálogo mínimo, duas escolas, três fornecedores e um lançamento de cada tipo)
e inicia o Next na porta 4000. Login `admin`, senha `teste123`. **Não lê o
`.env.local` e não toca no Supabase**; ao fechar a janela, o banco é descartado.

Como o schema vem de `prisma/schema.prisma`, os patches SQL de
`prisma/patches/` **não precisam ser aplicados** nesse modo — eles existem só
para atualizar um banco que já tem dados, como o de produção.

### Servidor de desenvolvimento comum (precisa de um banco)

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Para popular o banco com dados iniciais (produtos, escolas, responsável, admin):

```bash
ADMIN_SEED_PASSWORD="sua-senha" npx prisma db seed
```

Para regenerar os tipos do Prisma após alterar o schema:

```bash
npx prisma generate
```

---

## Scripts Utilitários

Ficam em `scripts/`. Rodar sempre com `--env-file=.env.local`:

### `gerar-icones.js`

Gera todos os ícones Android (todas as densidades) a partir de `public/semae-original.jpeg`.

```bash
node scripts/gerar-icones.js
```

Gera `ic_launcher.png`, `ic_launcher_round.png` e `ic_launcher_foreground.png` para mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi.

### `gerar-pdf-teste.mjs`

Cria três saídas de teste no banco e abre os HTML gerados no navegador:

```bash
node --env-file=.env.local scripts/gerar-pdf-teste.mjs
```

| Cenário | Itens | Qtd cada | Layout esperado |
|---|---|---|---|
| 10 produtos | 10 | 5 | T1 – 1 coluna confortável |
| 30 produtos | 30 | 12 | T3 – 2 colunas, ~1 folha |
| Todos (38) | 38 | 25 | T3 – 2 colunas, ~1 folha |

> Os arquivos HTML ficam em `scripts/pdf-cenario-*.html` e podem ser abertos direto no navegador para impressão de teste.

---

## Deploy – Vercel

Repositório conectado: `Duppbr/semae-varzeadopoco`. Push para `main` dispara deploy automático.

```bash
npm run vercel-build
# executa: npx prisma generate && next build
```

O seed **não** roda no deploy. Migrations devem ser aplicadas manualmente no Supabase.

**URL de produção**: `https://semae-varzeadopoco.vercel.app`

> Alterações em páginas web (layout, API, lógica) vão ao ar via Vercel sem precisar de novo APK.
> Apenas mudanças nativas (plugins Java, ícones, permissões Android) exigem rebuild do APK.

---

## App Android – Capacitor

**Arquivo de configuração**: `capacitor.config.ts`

```ts
appId:   'com.semae.varzeadopoco'
appName: 'SEMAE'
webDir:  'mobile'
server:  {
  url:       'https://semae-varzeadopoco.vercel.app',
  cleartext: false
}
```

O APK carrega o site do Vercel via WebView — sem rebuild para atualizar conteúdo web.

### Sincronizar com Android Studio

```bash
npx cap sync android
npx cap open android
```

### Ícones

Ícones adaptativos (Android 8+) em `android/app/src/main/res/mipmap-*/`:

- `ic_launcher_foreground.png` — camada frontal do ícone adaptativo (o que aparece no launcher)
- `ic_launcher.png` — ícone legado (Android < 8)
- `ic_launcher_round.png` — variante circular legada

XML adaptativo: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

Para regenerar a partir de `public/semae-original.jpeg`:

```bash
node scripts/gerar-icones.js
```

---

## Build APK – GitHub Actions

**Workflow**: `.github/workflows/build-apk.yml`
**Trigger**: push para `main` no repositório `semae-varzeadopoco` ou dispatch manual

Etapas:
1. Checkout
2. Node.js 22 + npm cache
3. `npm ci`
4. `npx cap sync android`
5. Java 21 (Temurin)
6. Android SDK
7. `chmod +x android/gradlew`
8. `./gradlew assembleDebug --no-daemon`
9. Upload do artefato `SEMAE-debug-{run_number}` (retido 90 dias)

APK gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

Para build local (requer Android Studio instalado):

```powershell
$env:JAVA_HOME  = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\Duppbr\AppData\Local\Android\Sdk"
npx cap sync android
.\android\gradlew.bat -p android assembleDebug --no-daemon
```

---

## PWA / Offline

**Service worker**: `public/sw.js`
**Cache**: `semae-v2-public-only`
**Manifest**: `public/manifest.json`

- Pré-cacheia assets shell na instalação
- Rotas `/api/*` **não** são cacheadas (retornam 503 offline)
- Somente o shell público é armazenado; páginas autenticadas e PDFs não ficam disponíveis após logout pelo cache.
- Sem rede, a navegação retorna `public/offline.html`.
- Instalável como PWA (display: standalone, theme: `#1e3a5f`)

Registro: `src/components/ServiceWorkerRegister.tsx` importado no `src/app/layout.tsx`.

---

## Segurança

- **Sessão**: cookie HTTP-only, `sameSite: none` em produção, `sameSite: lax` em dev, `maxAge`: 15 dias
- **Senhas**: bcrypt (salt automático via bcryptjs)
- **SECRET_COOKIE_PASSWORD**: mínimo 32 caracteres validado em runtime dentro de `getSession()`
- **Autenticação**: verificada em todas as rotas API e nas páginas PDF server-side
- **Role**: `funcionario` (acesso padrão) e `admin` (acesso a `/admin/*`)
- **Auditoria**: toda criação, edição e exclusão gera registro em `Auditoria` com usuário, IP, user-agent e resumo
- **Usuário protegido**: `protegido: true` impede exclusão/desativação do admin principal via API

---

## Regras de Negócio

| Regra | Descrição |
|---|---|
| Estoque negativo permitido | Saídas e descartes podem deixar estoque negativo — representa entregas emergenciais ou ajustes posteriores. Não bloqueia o fluxo. |
| Numeração automática | `Entrada`, `Saida`, `Descarte` e `PedidoCompra` têm `numero` autoincremental único |
| Status de Saída | Inicia em `PENDENTE`. Atualiza para `ENTREGUE` ou `CANCELADO` |
| Status de Pedido | Novos pedidos: `PENDENTE`; legado `RASCUNHO` aparece como Pedido pendente. `ENVIADO`, `PARCIAL`, `ATENDIDO`, `CANCELADO`. Atendimento é calculado pelo recebimento. |
| Itens em cascata | Excluir uma movimentação remove seus itens automaticamente (`onDelete: Cascade`) |
| Estoque mínimo | `estoqueMinimo` no Produto. Dashboard alerta quando `quantidade <= estoqueMinimo` |
| Itens do PDF ordenados | Ordenação por nome do produto ou descrição livre |
| Recebimento | Gera Entrada vinculada ao pedido; só quantidades confirmadas entram no estoque. Remover da conferência mantém pendente; encerrar saldo exige justificativa. |
| Item sem cadastro | Pedido permite descrição e unidade sem Produto. Para receber, vincular a produto ativo da mesma unidade; o cadastro continua administrativo. |
| Cancelamento de saída | Devolve o estoque uma única vez, dentro da transação. Saída cancelada não pode ser reaberta; criar outra. |
| Histórico | `MovimentoEstoque` retém produto, unidade, quantidade, saldo, autor, data operacional e data de registro, mesmo após exclusão do documento. |

---

## Decisões Técnicas

| Decisão | Motivo |
|---|---|
| `serverExternalPackages: ['@prisma/client', '.prisma/client']` no `next.config.ts` | Turbopack resolvia `.prisma/client` com condição `browser`, carregando `index-browser.js` — causava "Prisma Client not initialized" em dev |
| Validação do `SECRET_COOKIE_PASSWORD` dentro de `getSession()` | No nível de módulo causava crash imediato da função serverless no Vercel (response body vazio) |
| Porta 6543 (pooler transação) no `DATABASE_URL` | Vercel abre conexão por invocação. Modo sessão (5432) esgota o pool do Supabase free tier |
| Eventos React em `PdfActions` | Corrige scripts inertes após navegação e eventos de navegador indevidamente definidos em Server Components |
| Botão Voltar navega por URL (remove `/pdf`) em vez de `history.back()` | `history.back()` falha no Capacitor quando o PDF é a primeira página carregada; navegar por URL é mais confiável |
| Plugin nativo `SemaePdfPlugin` para imprimir/compartilhar no Android | `window.print()` é silencioso no WebView do Capacitor; `navigator.share()` pode falhar; o plugin usa as APIs nativas reais do Android (`PrintManager`, `Intent.ACTION_SEND`) |
| PDF binário com paginação automática | Evita compartilhar somente URL protegida; preserva texto e suporta documentos extensos |
| APK aponta para Vercel via `server.url` | Atualizações de conteúdo web vão ao ar sem rebuild. Rebuild só necessário para mudanças nativas |
| Sem rebuild de APK para mudanças de layout/API | Política adotada para agilidade: push para `semae/main` publica no Vercel; APK só é rebuilt quando há mudança nativa (plugin, ícones, permissões) |
| Estoque negativo não bloqueia | Decisão operacional: registros emergenciais e ajustes posteriores devem ser possíveis sem travar o fluxo |

## Entrega e validação

### Escopo da revisão de 15/09/2026

Trabalho feito em `C:\Users\Duppbr\Documents\SEMAE`. Prime Cred foi usado **somente para leitura**, especificamente `docs/auditoria-ia/07-AUDITORIA-VIBE-CODE-SEGURANCA.md`. Nenhum arquivo daquele projeto foi alterado. Nenhum deploy, push, seed ou atualização do banco de produção foi executado nesta rodada.

### Falhas encontradas e correções

| Falha | Correção |
|---|---|
| Saída PDF com `onError` de navegador em Server Component | Retirados os eventos do servidor; controles em Client Component. Isso causava erro de renderização mesmo com build aprovado. |
| PDFs duplicavam `html`/`body` e dependiam de scripts HTML | Estrutura compartilhada válida e eventos React, inclusive após navegação interna. |
| Compartilhar enviava somente URL protegida por login | Geração de arquivo PDF e envio nativo com MIME `application/pdf`. |
| Impressão Android falhava silenciosamente ou virava compartilhamento | Plugin PrintManager, registro via `registerPlugin` e erro explícito. Links não abrem janela externa. |
| Entradas e descartes não abriam | Lista clicável, página completa de itens, histórico e PDF em ambos. |
| Estoque baixo tinha critérios diferentes | Regra única: saldo menor **ou igual** ao mínimo, incluindo zero e negativos. |
| Ajuste exibia sucesso mesmo quando API falhava | Atualiza a tela somente após sucesso; exige motivo e verifica saldo anterior para evitar sobrescrita desatualizada. |
| Não existia extrato durável de movimentações | Tabela MovimentoEstoque com snapshots e consulta paginada por produto/documento. |
| Cancelar saída não estornava estoque | Estorno transacional; cancelar novamente ou excluir saída cancelada não estorna em dobro. |
| Pedido só aceitava produto cadastrado e status manual | Descrição livre com unidade, conferência, recebimento parcial, quantidades recebidas/canceladas/pendentes. |
| Não havia origem do pedido na entrada | Entrada relacionada ao PedidoCompra, links nos dois sentidos e referência no histórico/PDF. |
| Repetir recebimento podia duplicar estoque | Chave única persistida, processamento serializável e rejeição de conflito/excesso. |
| Quantidades negativas/inválidas nas movimentações e unidades divergentes | Validação no servidor, produto ativo, unidade compatível, limites e rejeição de duplicados nas movimentações manuais. O **saldo** negativo continua permitido. |
| Datas civis apareciam no dia anterior | Formatação em UTC para datas operacionais e data atual no fuso de São Paulo nos formulários. |
| Dashboard somava kg, litros e unidades | Indicador passou a contar produtos com saldo positivo; contagens diárias usam data operacional. |
| Relatórios exibiam zero ou tentavam renderizar objetos React | Contratos corrigidos, somatório dos dias, contagem de documentos, categoria/unidade como texto e exclusão de saídas canceladas. |
| Respostas atrasadas e erros HTTP quebravam listas | Cancelamento de buscas e tratamento explícito de falhas nos fluxos revisados. |
| Sessão mantinha acesso após desativação/rebaixamento | Revalidação do usuário ativo e papel atual em getSession. |
| CORS não impedia gravação CSRF | Proxy valida origem de requisições mutantes; autenticação continua dentro das APIs. |
| Service worker armazenava páginas privadas | Cache limitado a assets públicos; versão nova remove cache antigo. |
| Dependências antigas vulneráveis | Atualização compatível das dependências e Next/ESLint 16.3.5. Pendências abaixo, sem usar `audit fix --force`. |

### Atualização do banco e publicação

1. Fazer backup/restauração verificável do PostgreSQL e programar uma janela sem lançamentos.
2. Aplicar **antes do novo código** `prisma/patches/20260913-operacoes.sql` no banco correto. O script usa transação, adiciona campos/tabela/índices e importa documentos existentes para o histórico sem alterar seus saldos. Foi testado com reexecução sem duplicação.
3. Aplicar, também antes do novo código, `prisma/patches/20260922-fornecedores.sql`. O script cria a tabela `Fornecedor`, liga o fornecedor ao pedido e à entrada, renomeia `Entrada.fornecedor` para `Entrada.fornecedorNome` e cadastra automaticamente os fornecedores que só existiam como texto nas entradas antigas, unificando grafias diferentes do mesmo nome. Também preenche o fornecedor dos pedidos anteriores, quando todas as entradas do pedido vieram da mesma empresa; pedido recebido de mais de uma empresa fica sem vínculo, porque não dá para escolher uma sem inventar. Usa transação e foi testado com reexecução e contra uma cópia do schema anterior.
4. Gerar o cliente (`npx prisma generate`) e publicar o build web (`npm run build`). Não usar `db push --accept-data-loss` nem seed de demonstração em produção.
5. Sincronizar/compilar e instalar o APK atualizado. Testar compartilhar um arquivo com outro app e imprimir/salvar como PDF no dispositivo real.
6. Conferir uma entrada, saída, descarte, pedido parcial e seus saldos/históricos após a publicação.

Exemplo de aplicação local do SQL, **somente após conferir o destino de DATABASE_URL e ter backup**:

```powershell
node --env-file=.env.local node_modules/prisma/build/index.js db execute --schema prisma/schema.prisma --file prisma/patches/20260913-operacoes.sql
node --env-file=.env.local node_modules/prisma/build/index.js db execute --schema prisma/schema.prisma --file prisma/patches/20260922-fornecedores.sql
npx prisma generate
npm run build
```

O projeto não tinha uma base de migrations versionadas. Por isso esta entrega inclui um patch SQL explícito, em vez de executar uma migração destrutiva ou criar uma baseline fictícia. O patch não é aplicado automaticamente no deploy.

### Testes executados

- `npm test`: 12 grupos de verificação de regras e serviços em PostgreSQL embarcado PGlite descartável. Inclui rollback, duplicação de recebimento, excesso, unidade incompatível, negativos, estornos, histórico legado e PDF de 150 itens.
- `npm run test:web`: 22 grupos no total, com Playwright/Chrome a 390 x 844 e 1366 x 900. Login, CSRF, quatro PDFs/download/retorno, acionamento de impressão web, detalhes pelas listas, item sem cadastro, recebimento parcial, histórico, estoque baixo, relatório e revogação de sessão. Sem erros JavaScript capturados.
- `npx tsc --noEmit` e `npm run build`: aprovados.
- `npm run lint`: sem erros; ainda há avisos em código legado, especialmente dependências de hooks e navegação de autenticação.
- `npx cap sync android` e Gradle `assembleDebug`: aprovados. APK em `android/app/build/outputs/apk/debug/app-debug.apk`.
- PDF baixado inspecionado com pdfinfo/Poppler: arquivo A4 válido, texto e logo renderizados. Evidências locais em `test-results/` (fora do controle de versão).
- `adb devices` não encontrou dispositivo. **Compartilhamento/impressão nativos foram implementados e compilados, mas não validados em celular nesta sessão.** Acionamento web não prova que o serviço de impressão do Android está instalado/configurado.

### Prévia isolada

```powershell
npm run preview:teste
```

Cria um banco em memória, executa as verificações e mantém uma prévia em `http://localhost:3107/login`. Usa somente dados fictícios. Login de demonstração: `teste-local`; senha: `Somente-Teste-Local-2026`. Nunca utilizar essa conta/senha em produção. Encerrar com Ctrl+C; o banco de teste é descartado. Requer Chrome instalado e portas 3107/55439 livres. `DATABASE_URL` é sobrescrita pelo script antes de importar Prisma, sem utilizar a conexão de produção.

### Limites e próximos cuidados

- Dados históricos anteriores: documentos ainda existentes são importados com saldo/autor não apurados. Não é possível reconstruir com certeza itens já excluídos ou ajustes não registrados. Pedidos antes marcados ATENDIDO não ganham recebimentos fictícios.
- Saídas canceladas no código antigo podem ter saldo incorreto. Exigem conferência e ajuste com motivo; o patch não devolve estoque automaticamente e arrisca um estorno duplo.
- Encerramento de itens sem entrega também fica documentado em uma entrada vinculada, que pode não ter itens recebidos. Isso não adiciona saldo. Entradas vinculadas não podem ser apagadas; correções físicas usam ajuste documentado.
- PGlite não reproduz toda a concorrência de PostgreSQL/Supabase. Transações são serializáveis e conflitos retornam 409; um teste concorrente de carga em homologação continua recomendado.
- Idempotência persistente foi implementada no recebimento de pedidos. Criações manuais de entrada/saída/descarte/pedido ainda precisam de uma chave própria para proteger retries após perda de resposta.
- Auditoria transacional cobre as operações revisadas. Cadastros administrativos legados ainda usam o helper de auditoria tolerante a falhas; migrar esses fluxos e acrescentar testes de permissões é uma etapa separada.
- Auditoria npm em 15/09: produção (`--omit=dev`) tem 3 achados altos relacionados ao CLI Prisma/deepmerge-ts; auditoria completa tem 10 achados (3 moderados, 6 altos, 1 crítico), incluindo ferramentas de assets Android. Não declarar o projeto livre de vulnerabilidades. Tratar versões incompatíveis em atualização controlada, sem forçar downgrade do Prisma.
- Limitação de tentativas de login distribuída, política de backup testada e monitoramento de erros ainda precisam ser implantados/configurados. Não foram inventados serviços externos ou credenciais.
- O arquivo `.git` desta pasta ainda aponta para o worktree antigo e `git status` falhou (`not a git repository`). Não foi recriado nem sobrescrito o histórico Git. Resolver o vínculo/repositório antes de commit/push/deploy.

### Referências técnicas consultadas

- Documentação local de Next.js em `node_modules/next/dist/docs/`: fronteira cliente/servidor, proxy e error boundary (`retry` na versão instalada).
- [Capacitor: implementação Android de plugins](https://capacitorjs.com/docs/plugins/tutorial/android-implementation).
- [Android: compartilhamento seguro com FileProvider](https://developer.android.com/training/secure-file-sharing/share-file).
- [PGlite Socket: uso e limitações](https://pglite.dev/docs/pglite-socket).
