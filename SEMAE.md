# SEMAE – Sistema de Gestão de Alimentação Escolar

**Prefeitura Municipal de Várzea do Poço – BA**

Sistema web + Android para controle de estoque, distribuição de merenda para escolas, descartes e pedidos de compra.

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

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework web | Next.js (App Router) | 16.2.4 |
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
| `/entrada` | `src/app/entrada/page.tsx` | Lista de entradas com filtro de status |
| `/entrada/nova` | `src/app/entrada/nova/page.tsx` | Formulário de nova entrada de mercadoria |
| `/saida` | `src/app/saida/page.tsx` | Lista de saídas com filtro por status |
| `/saida/nova` | `src/app/saida/nova/page.tsx` | Formulário de nova saída para escola |
| `/saida/[id]` | `src/app/saida/[id]/page.tsx` | Detalhe da saída com opção de editar status |
| `/saida/[id]/pdf` | `src/app/saida/[id]/pdf/page.tsx` | PDF da saída – Controle de Saída de Mercadorias |
| `/descarte` | `src/app/descarte/page.tsx` | Lista de descartes |
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
| `GET` | `/api/estoque/[id]` | Detalhe do estoque de um produto |
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

### Administração (role `admin`)

CRUD completo (GET lista, POST cria, GET/PUT/DELETE por `[id]`) em:

- `/api/admin/produtos`
- `/api/admin/escolas`
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
```

#### Movimentações

```
Entrada         id, numero*autoincr, data, responsavelId, fornecedor, observacao, createdAt
                → responsavel, itens[]

ItemEntrada     id, entradaId[CASCADE], produtoId, quantidade, unidadeId

Saida           id, numero*autoincr, data, escolaId, responsavelId, recebedor, observacao,
                status[PENDENTE|ENTREGUE|CANCELADO], createdAt
                → escola, responsavel, itens[]

ItemSaida       id, saidaId[CASCADE], produtoId, quantidade, unidadeId

Descarte        id, numero*autoincr, data, responsavelId, motivo, observacao, createdAt
                → responsavel, itens[]

ItemDescarte    id, descarteId[CASCADE], produtoId, quantidade, unidadeId

PedidoCompra    id, numero*autoincr, data, escolaId, responsavelId, observacao,
                status[RASCUNHO|ENVIADO|ATENDIDO|CANCELADO], createdAt
                → escola, responsavel, itens[]

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

### `src/lib/pdf-actions.ts`

Helper compartilhado para as páginas de PDF. Exporta duas funções:

- **`pdfActionScript(fallbackPath)`** — retorna o JavaScript inline com as funções globais `pdfVoltar()`, `pdfImprimir()` e `pdfCompartilhar()`. A lógica de prioridade é:
  1. Plugin nativo `window.Capacitor.Plugins.SemaePdf` (APK Android)
  2. `navigator.share()` (browser moderno)
  3. Copia o link para a área de transferência como último recurso

- **`pdfActionBarHtml()`** — retorna o HTML dos três botões (← Voltar, 📤 Compartilhar, 🖨️ Imprimir) com atributos `onclick` reais.

---

## Documentos PDF

### Rotas

| Rota | Documento |
|---|---|
| `/saida/[id]/pdf` | Controle de Saída de Mercadorias |
| `/pedido-compra/[id]/pdf` | Pedido de Compra |

Ambas verificam sessão server-side antes de buscar dados. Retornam HTML puro (`<html>…</html>`) — não são componentes React com hidratação.

### Layout modular por quantidade de itens

O PDF de saída adapta fontes e layout conforme o número de itens, garantindo que caiba em uma folha A4 sempre que possível:

| Tier | Itens | Colunas | Fonte linhas | Padding linhas |
|---|---|---|---|---|
| T1 | ≤ 12 | 1 coluna | 12 px | 8 px / 12 px (confortável) |
| T2 | 13 – 20 | 1 coluna | 11 px | 6 px / 10 px |
| T3 | 21 – 42 | 2 colunas | 10 px | 4 px / 7 px — cabe ~1 folha |
| T4 | 43+ | 2 colunas | 9 px | 3 px / 6 px — 2 folhas naturalmente |

A coluna de itens usa `flex: 1` dentro de um `.content` em flexbox coluna (`min-height: 228mm`), e as assinaturas usam `margin-top: auto` — ficam sempre na parte inferior da folha independente da quantidade de itens.

### Cabeçalho

O cabeçalho tem três zonas:

```
[ logo-semae.png ] | SEMAE – Setor Municipal de Alimentação Escolar | [ logo-sec-educacao.jpeg ]
                   | Prefeitura Municipal de Várzea do Poço – BA    |
```

Arquivos:
- `public/logo-semae.png` — logo SEMAE
- `public/logo-sec-educacao.jpeg` — brasão Várzea do Poço + "Secretaria de Educação"

### Watermark

Logo SEMAE como fundo desbotado (`opacity: 0.04`) posicionada no centro da folha.

### Botões de ação (barra sticky no topo)

```
← Voltar   |   📤 Compartilhar   |   🖨️ Imprimir
```

- Barra `position: sticky; top: 0` — sempre visível, nunca sobreposta ao conteúdo
- Oculta no `@media print`
- Botões usam `dangerouslySetInnerHTML` com `onclick` HTML puro (ver Decisões Técnicas)

### Plugin nativo Android – `SemaePdfPlugin`

Arquivo: `android/app/src/main/java/com/semae/varzeadopoco/SemaePdfPlugin.java`

| Método | O que faz |
|---|---|
| `print(title)` | Chama `WebView.createPrintDocumentAdapter()` + `PrintManager` do Android — abre o diálogo de impressão nativo |
| `share(title, text, url, dialogTitle)` | Dispara `Intent.ACTION_SEND` — abre o seletor nativo (WhatsApp, Drive, etc.) |

Registrado em `MainActivity.java` via `registerPlugin(SemaePdfPlugin.class)`.

> **Importante:** alterações no plugin exigem novo APK. O Vercel deploy não atualiza código nativo.

### `@page { size: A4 }`

Garante que ao imprimir (desktop ou Android) o papel seja sempre A4 independente do dispositivo.

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
**Cache**: `semae-v1`
**Manifest**: `public/manifest.json`

- Pré-cacheia assets shell na instalação
- Rotas `/api/*` **não** são cacheadas (retornam 503 offline)
- Páginas sem cache retornam `public/offline.html`
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
| Status de Pedido | `RASCUNHO` → `ENVIADO` → `ATENDIDO` (ou `CANCELADO` em qualquer etapa) |
| Itens em cascata | Excluir uma movimentação remove seus itens automaticamente (`onDelete: Cascade`) |
| Estoque mínimo | `estoqueMinimo` no Produto. Dashboard alerta quando `quantidade <= estoqueMinimo` |
| Itens do PDF ordenados | Na rota PDF, `itens` são sempre ordenados alfabeticamente por nome de produto |

---

## Decisões Técnicas

| Decisão | Motivo |
|---|---|
| `serverExternalPackages: ['@prisma/client', '.prisma/client']` no `next.config.ts` | Turbopack resolvia `.prisma/client` com condição `browser`, carregando `index-browser.js` — causava "Prisma Client not initialized" em dev |
| Validação do `SECRET_COOKIE_PASSWORD` dentro de `getSession()` | No nível de módulo causava crash imediato da função serverless no Vercel (response body vazio) |
| Porta 6543 (pooler transação) no `DATABASE_URL` | Vercel abre conexão por invocação. Modo sessão (5432) esgota o pool do Supabase free tier |
| `dangerouslySetInnerHTML` nos botões do PDF | Páginas PDF retornam `<html>` diretamente sem hidratação React. `onClick="string"` em JSX não vira atributo `onclick` HTML — React silenciosamente ignora strings em event handlers |
| Botão Voltar navega por URL (remove `/pdf`) em vez de `history.back()` | `history.back()` falha no Capacitor quando o PDF é a primeira página carregada; navegar por URL é mais confiável |
| Plugin nativo `SemaePdfPlugin` para imprimir/compartilhar no Android | `window.print()` é silencioso no WebView do Capacitor; `navigator.share()` pode falhar; o plugin usa as APIs nativas reais do Android (`PrintManager`, `Intent.ACTION_SEND`) |
| Layout modular em 4 tiers no PDF | Documentos com poucos itens precisam de fonte maior para leitura confortável em campo; documentos com muitos itens precisam caber em 1 folha A4. Threshold de duas colunas: 21 itens |
| Assinaturas com `margin-top: auto` em flex column | Garante que as assinaturas fiquem sempre no fundo da folha independente da quantidade de itens — documento visualmente uniforme |
| APK aponta para Vercel via `server.url` | Atualizações de conteúdo web vão ao ar sem rebuild. Rebuild só necessário para mudanças nativas |
| Sem rebuild de APK para mudanças de layout/API | Política adotada para agilidade: push para `semae/main` publica no Vercel; APK só é rebuilt quando há mudança nativa (plugin, ícones, permissões) |
| Estoque negativo não bloqueia | Decisão operacional: registros emergenciais e ajustes posteriores devem ser possíveis sem travar o fluxo |
