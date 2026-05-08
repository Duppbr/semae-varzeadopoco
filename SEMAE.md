# SEMAE – Sistema de Gestão de Alimentação Escolar

**Prefeitura Municipal de Várzea do Poço – BA**

Sistema web + Android para controle de estoque, distribuição para escolas, descartes e pedidos de compra do setor de merenda escolar.

---

## Índice

1. [Stack Tecnológica](#stack-tecnológica)
2. [Módulos e Rotas](#módulos-e-rotas)
3. [API REST](#api-rest)
4. [Banco de Dados](#banco-de-dados)
5. [Componentes](#componentes)
6. [Configuração do Ambiente](#configuração-do-ambiente)
7. [Como Rodar Localmente](#como-rodar-localmente)
8. [Deploy – Vercel](#deploy--vercel)
9. [App Android – Capacitor](#app-android--capacitor)
10. [Build APK – GitHub Actions](#build-apk--github-actions)
11. [PWA / Offline](#pwa--offline)
12. [Segurança](#segurança)
13. [Regras de Negócio](#regras-de-negócio)
14. [Decisões Técnicas](#decisões-técnicas)

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
| `/relatorios` | `src/app/relatorios/page.tsx` | 6 tipos de relatório com filtro de período e exportação |

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
| `GET` | `/api/auth/me` | Retorna dados da sessão atual: `{ isLoggedIn, id, nome, role, ... }` |

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

### Cadastros Auxiliares (seletores)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/escolas` | Lista escolas ativas (para dropdowns); aceita `?ativo=true` |
| `GET` | `/api/responsaveis` | Lista responsáveis ativos; aceita `?ativo=true` |

### Administração (role `admin`)

Todas as rotas abaixo seguem o padrão CRUD completo (GET lista, POST cria, GET/PUT/DELETE por `[id]`):

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
**Arquivo de schema**: `prisma/schema.prisma`

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

O banco usa o pooler em **modo transação** (porta 6543) para compatibilidade com Vercel serverless:

```env
DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

Não usar a porta 5432 (modo sessão) em produção — esgota o pool de conexões.

---

## Componentes

### `src/components/AppShell.tsx`

Wrapper de layout para todas as páginas autenticadas.

Props: `title`, `backHref?`, `actions?` (botões no header), `noPadding?`, `children`

Inclui:
- Header fixo com botão voltar, título e ações
- Logout via `POST /api/auth/logout`
- `<TabBar />` na parte inferior
- Padding seguro para notch/status bar

### `src/components/TabBar.tsx`

Barra de navegação inferior com 4 abas fixas + menu "Mais":

| Aba | Rota |
|---|---|
| Início | `/dashboard` |
| Saída | `/saida` |
| Entrada | `/entrada` |
| Estoque | `/estoque` |

Menu "Mais" (bottom sheet): Descarte, Pedido de Compra, Relatórios, Administração.

### `src/components/ServiceWorkerRegister.tsx`

Client component que registra `/sw.js` no `navigator.serviceWorker` ao montar. Importado no layout raiz.

---

## Configuração do Ambiente

Arquivo: `.env.local` (nunca versionar)

```env
# Supabase – pooler modo transação (porta 6543)
DATABASE_URL="postgresql://postgres.<ref>:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Mínimo 32 caracteres – usado pelo iron-session
SECRET_COOKIE_PASSWORD="gere-um-segredo-aleatorio-com-32-chars"
```

Variáveis opcionais (seed e CORS mobile):

```env
ADMIN_SEED_PASSWORD="senha-forte-para-usuario-admin-inicial"
ALLOWED_MOBILE_ORIGINS="https://semae-varzeadopoco.vercel.app"
```

As mesmas variáveis devem ser configuradas no painel do Vercel em **Settings → Environment Variables**.

---

## Como Rodar Localmente

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000`

O usuário `admin` é criado via seed. Para popular o banco com dados iniciais:

```bash
ADMIN_SEED_PASSWORD="sua-senha" npx prisma db seed
```

Para regenerar os tipos do Prisma após alterar o schema:

```bash
npx prisma generate
```

---

## Deploy – Vercel

O projeto está conectado ao repositório `Duppbr/semae-varzeadopoco` no GitHub. Todo push para `main` dispara um deploy automático.

**Comando de build** configurado no `package.json`:

```bash
npm run vercel-build
# executa: npx prisma generate && next build
```

O seed **não** roda automaticamente no deploy. Migrations devem ser aplicadas manualmente via Supabase ou CLI do Prisma antes de cada alteração de schema.

**URL de produção**: `https://semae-varzeadopoco.vercel.app`

---

## App Android – Capacitor

**Arquivo de configuração**: `capacitor.config.ts`

```ts
appId:   'com.semae.varzeadopoco'
appName: 'SEMAE'
webDir:  'mobile'           // placeholder local
server:  {
  url:       'https://semae-varzeadopoco.vercel.app',
  cleartext: false
}
```

O APK carrega o site do Vercel diretamente via WebView — sem necessidade de rebuild do APK para atualizar conteúdo web.

### Como sincronizar e abrir no Android Studio

```bash
npx cap sync android
npx cap open android
```

### Ícones Android

Os ícones adaptativos (Android 8+) ficam em:

```
android/app/src/main/res/
  mipmap-mdpi/    ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png
  mipmap-hdpi/    ...
  mipmap-xhdpi/   ...
  mipmap-xxhdpi/  ...
  mipmap-xxxhdpi/ ...
```

`ic_launcher_foreground.png` é o que o Android 8+ usa (ícone adaptativo). As outras densidades são para legado.

O XML adaptativo fica em `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`.

Para regenerar todos os ícones a partir de `semae-original.jpeg`:

```bash
node scripts/gerar-icones.js
```

### PDF no app Android

As páginas de PDF (`/saida/[id]/pdf` e `/pedido-compra/[id]/pdf`) têm uma barra de ações sticky no topo com três botões:

- **← Voltar** – navega para a rota pai (remove `/pdf` da URL)
- **📤 Compartilhar** – usa `navigator.share()` para abrir o seletor nativo do Android
- **🖨️ Imprimir** – no Capacitor/Android chama Compartilhar; em browser desktop abre `window.print()`

Importante: `window.print()` **não funciona** no WebView do Capacitor. `navigator.share()` é a solução para mobile.

Os botões usam `dangerouslySetInnerHTML` com atributos `onclick` HTML puros — `onClick` do React não funciona em páginas que retornam `<html>` diretamente sem hidratação.

---

## Build APK – GitHub Actions

**Arquivo**: `.github/workflows/build-apk.yml`  
**Trigger**: push para `main` do repositório `semae-varzeadopoco` ou dispatch manual

Etapas:
1. Checkout do código
2. Node.js 22 + npm cache
3. `npm ci`
4. `npx cap sync android` (cria `android/app/src/main/assets/`)
5. Java 21 (Temurin)
6. Android SDK
7. `chmod +x android/gradlew`
8. `./gradlew assembleDebug --no-daemon`
9. Upload do artefato `SEMAE-debug-{run_number}` (retido 90 dias)

O APK gerado fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

> Para gerar um APK de release assinado seria necessário configurar uma keystore como secret no GitHub.

---

## PWA / Offline

**Service worker**: `public/sw.js`  
**Cache**: `semae-v1`  
**Manifest**: `public/manifest.json`

Comportamento:
- Pré-cacheia os assets shell ao instalar
- Requisições a `/api/*` **não** são cacheadas (retornam 503 offline)
- Páginas não cacheadas retornam `public/offline.html`
- Instalável como PWA (display: standalone, theme: #1e3a5f)

Registro: `src/components/ServiceWorkerRegister.tsx` importado no `src/app/layout.tsx`.

---

## Segurança

- **Sessão**: cookie HTTP-only, `sameSite: none` em produção, `sameSite: lax` em desenvolvimento, `maxAge`: 15 dias
- **Senhas**: bcrypt com salt automático
- **SECRET_COOKIE_PASSWORD**: validado com mínimo de 32 caracteres em runtime
- **Autenticação**: verificada em todas as rotas API e nas páginas PDF server-side
- **Role**: `funcionario` (acesso padrão) e `admin` (acesso a `/admin/*`)
- **Auditoria**: toda criação, edição e exclusão gera registro na tabela `Auditoria` com usuário, IP, user-agent e resumo da ação
- **Usuário protegido**: campo `protegido: true` impede exclusão/desativação via API do usuário admin principal

---

## Regras de Negócio

| Regra | Descrição |
|---|---|
| Estoque negativo permitido | Saídas e descartes podem deixar estoque negativo. Não bloqueia o fluxo — representa entregas emergenciais ou ajustes posteriores |
| Numeração automática | `Entrada`, `Saida`, `Descarte` e `PedidoCompra` têm campo `numero` autoincremental único |
| Status de Saída | Inicia em `PENDENTE`. Pode ser atualizado para `ENTREGUE` ou `CANCELADO` |
| Status de Pedido | Fluxo: `RASCUNHO` → `ENVIADO` → `ATENDIDO` (ou `CANCELADO` em qualquer etapa) |
| Itens em cascata | Ao excluir uma movimentação, seus itens são removidos automaticamente (`onDelete: Cascade`) |
| Estoque mínimo | Campo `estoqueMinimo` no Produto. Dashboard alerta quando `estoque.quantidade <= estoqueMinimo` |

---

## Decisões Técnicas

| Decisão | Motivo |
|---|---|
| `serverExternalPackages: ['@prisma/client', '.prisma/client']` no `next.config.ts` | Turbopack resolvia `.prisma/client` com a condição `browser`, carregando `index-browser.js` ao invés do cliente server. Isso causava "Prisma Client not initialized" em dev |
| Validação do `SECRET_COOKIE_PASSWORD` dentro de `getSession()` | Colocar no nível de módulo causava crash imediato da função serverless no Vercel (body vazio na resposta) |
| Porta 6543 (pooler transação) para DATABASE_URL | Vercel serverless abre conexão por invocação. Modo sessão (5432) esgota o pool do Supabase free tier |
| `dangerouslySetInnerHTML` nos botões do PDF | Páginas PDF retornam `<html>` diretamente sem hidratação React. O prop `onClick` do React não vira atributo `onclick` HTML nessas páginas |
| `navigator.share()` no lugar de `window.print()` no Android | `window.print()` é silencioso no WebView do Capacitor — não abre diálogo de impressão |
| APK aponta para Vercel via `server.url` | Atualizações do sistema não exigem novo APK. Apenas alterações nativas (permissões, plugins) precisam de rebuild |
| Estoque negativo não bloqueia | Decisão operacional: registros emergenciais e ajustes manuais posteriores devem ser possíveis sem travar o fluxo |
