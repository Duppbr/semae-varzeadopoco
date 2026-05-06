# Relatório Completo — App Mobile Rios Baterias

**Data:** 06/05/2026  
**Stack:** Next.js (web/admin) + Capacitor Android (APK) + Vercel (backend) + PostgreSQL (Supabase/Neon)

---

## O que foi pedido

### 1. APK Android para os vendedores
- App para os vendedores consultarem preços e estoque em campo
- Funcionar no celular sem depender de abrir o navegador
- Ícone personalizado com a logo da Rios Baterias (não o ícone padrão do Capacitor)

### 2. Funcionamento offline
- App deve funcionar mesmo sem internet
- Dados devem ficar salvos no dispositivo
- Poder navegar entre as telas sem recarregar (comportamento nativo)
- Quando voltar online, sincronizar automaticamente

### 3. Login e segurança
- Exigir login para acessar os preços (não deixar qualquer pessoa ver)
- Dados protegidos no dispositivo

### 4. Funcionalidades da consulta
- Ver produtos das duas lojas (Matriz Artêmia e Filial Iguatemi)
- Filtrar por tipo, marca, amperagem
- Atalhos rápidos configuráveis
- Indicador de prioridade de estoque (verde/amarelo/vermelho)
- Preço no cartão e preço à vista
- Copiar tabela formatada para WhatsApp

### 5. Notificações de sincronização
- App avisar quando há dados novos disponíveis no servidor

### 6. Outras melhorias feitas durante o processo
- Tela de erro offline personalizada (com botão "Tentar novamente")
- Fix de vulnerabilidades npm (Prisma 6.19.3)
- Fix de deploy bloqueado no Vercel (email do git)
- Backup completo com exportação/importação (produtos, opções, atalhos)
- Tabela WhatsApp na tela de consulta web
- Relatório de vulnerabilidades e deploy documentado

---

## O que foi implementado

### APK — Build automático via GitHub Actions

**Arquivo:** `.github/workflows/build-apk.yml`

- Build automático a cada push na branch `main`
- Usa Java 21 (versão exigida pelo capacitor-android; versão 17 causava erro de compilação)
- Retenção do APK por 90 dias nos artefatos do GitHub
- Download disponível em: GitHub → Actions → último build → artefato `rios-baterias-debug-N`

**Fix crítico:** `java-version: '17'` → `'21'`  
Erro original: `error: invalid source release: 21 in :capacitor-android:compileDebugJavaWithJavac`

---

### Ícone personalizado

**Arquivos:** `android/app/src/main/res/mipmap-*/ic_launcher.png` e `ic_launcher_round.png`

- Substituídos os ícones padrão do Capacitor pela logo da Rios Baterias
- Gerado automaticamente a partir de `public/icon-512.png` usando `sharp`
- Tamanhos gerados: ldpi (36px), mdpi (48px), hdpi (72px), xhdpi (96px), xxhdpi (144px), xxxhdpi (192px)

---

### Arquitetura do app mobile

**Problema identificado:** Next.js usa SSR (renderização no servidor). Isso significa que cada página depende do servidor Vercel para carregar. Sem internet = app não funciona. Não existe solução de "service worker" que resolva isso completamente porque o DNS falha antes do service worker interceptar.

**Solução adotada:** Capacitor no modo de arquivos locais (`webDir: 'mobile'`)

- A pasta `mobile/` contém um SPA (Single Page Application) completo em HTML/CSS/JS puro
- O Capacitor embute esses arquivos diretamente no APK (sem dependência de URL externa para carregar o app)
- Os dados do produto são buscados da API no Vercel e salvos em `localStorage`
- Offline: o app abre normalmente e usa os dados salvos no dispositivo
- Online: sincroniza silenciosamente em segundo plano

**`capacitor.config.ts`:**
```typescript
const config: CapacitorConfig = {
  appId: 'com.riosbaterias.app',
  appName: 'Rios Baterias',
  webDir: 'mobile',  // arquivos locais, sem server.url
  android: { allowMixedContent: false, backgroundColor: '#ffffff' },
};
```

---

### App mobile (`mobile/index.html`)

SPA completo com:

**Tela de login:**
- Campo "Identificador" e "Senha"
- Valida credenciais via `POST /api/auth/login` com cookie de sessão
- Na abertura, verifica sessão existente (`GET /api/auth/me`) — se válida, entra direto
- Se offline mas tiver cache → abre app com dados salvos
- Botão "Sair" no header → faz logout

**Tela principal:**
- Abas Matriz Artêmia / Filial Iguatemi
- Ponto verde/vermelho de status de conexão
- Data/hora da última sincronização
- Atalhos rápidos (configurados pelo admin na web)
- Busca por texto (amperagem, marca, tipo, nome)
- Filtros de tipo e marca via dropdown
- Cards de produto com:
  - Nome, marca, amperagem
  - Badges de CCA, tipo, garantia
  - Indicador de prioridade (•verde/•amarelo/•vermelho)
  - Preço no cartão e preço à vista
- Botão "Copiar tabela WhatsApp" (copia lista formatada)
- Sincronização automática ao ficar online
- Barra de aviso quando offline

---

### Segurança — APIs protegidas por sessão

**Problema original:** APIs retornavam dados sem autenticação (`Access-Control-Allow-Origin: *`)

**O que foi feito:**

- `/api/produtos-loja` — exige sessão ativa, retorna `401` se não logado
- `/api/atalhos` — exige sessão ativa, retorna `401` se não logado
- `/api/auth/login` — CORS para Capacitor + retorna `nome` do usuário
- `/api/auth/me` — CORS para Capacitor
- `/api/auth/logout` — CORS para Capacitor

**`src/lib/cors-mobile.ts`** — helper compartilhado de CORS:
- Aceita origens: `capacitor://localhost` (iOS), `http://localhost` (Android), `http://localhost:3000` (dev)
- `Access-Control-Allow-Credentials: true` — necessário para cookies cross-origin
- `Vary: Origin` — necessário para cache HTTP correto

**`src/lib/session.ts`:**
```typescript
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
```
`SameSite=None` é obrigatório para o cookie de sessão funcionar em requisições cross-origin do Capacitor Android para o Vercel.

---

### Problema de CORS (login "sem internet")

**Causa real:** O Capacitor Android usa `http://localhost` como origem das requisições fetch. O código anterior só aceitava `capacitor://localhost`, então o servidor rejeitava o CORS e o fetch lançava um `TypeError` — interpretado pelo app como "sem conexão".

**Origens aceitas agora:**
| Plataforma | Origin enviado |
|---|---|
| Capacitor Android | `http://localhost` |
| Capacitor iOS | `capacitor://localhost` |
| Desenvolvimento local | `http://localhost:3000` |
| Ionic | `ionic://localhost` |

---

### Backup e restauração (admin)

**Arquivo:** `src/app/api/admin/backup/`

- **Exportar:** JSON com produtos, opções e atalhos (`versão 2`)
- **Importar:** usa `upsert` (fix do problema onde "402 mudanças, nada aconteceu")
- **Reset completo:** opção para apagar tudo e reimportar (só usuários `protegido: true`)
- **UI** com checkboxes granulares e zona de perigo com confirmação digitando "RESETAR"

---

### Tabela WhatsApp na consulta web

**Arquivo:** `src/components/ListaProdutos.tsx`

- Botão "Copiar Tabela WhatsApp" aparece quando há resultados
- Copia texto formatado com preços, CCA, garantia e mensagem padrão
- Botão muda para "Copiado! ✓" por 2,5 segundos após copiar

---

### Vulnerabilidades npm corrigidas

| Antes | Depois |
|---|---|
| Prisma 6.19.0 (3 high via `effect` package) | Prisma 6.19.3 (0 vulnerabilidades) |
| 2 moderate restantes | 2 moderate (sem fix disponível) |

---

### Deploy Vercel — fix do bloqueio

**Causa:** git global estava com `user.email = duppbr@gmail.com`, mas a conta GitHub é `duppbr10@gmail.com`. O Vercel bloqueava deploys automáticos de commits sem usuário associado.

**Fix:**
```bash
git config --global user.email "duppbr10@gmail.com"
```

---

## Estado atual

| Funcionalidade | Status |
|---|---|
| APK gerado automaticamente | ✅ |
| Ícone personalizado | ✅ |
| App abre offline (com cache) | ✅ |
| Sincronização automática | ✅ |
| Login obrigatório | ✅ |
| APIs protegidas por sessão | ✅ |
| CORS Android corrigido | ✅ (fix mais recente) |
| Atalhos rápidos | ✅ |
| Filtros e busca | ✅ |
| Indicador de prioridade | ✅ |
| Copiar tabela WhatsApp | ✅ |
| Botão Sair | ✅ |
| Dados criptografados no dispositivo | ❌ (usa localStorage padrão) |
| Push notifications de sync | ❌ (não implementado) |
| Navegação sem reload (React Native) | ❌ (SPA HTML — não é nativo puro) |

---

## Pendente / Limitações conhecidas

1. **localStorage não é criptografado** — os dados de preço ficam em texto no dispositivo. Para criptografia real seria necessário `capacitor-secure-storage-plugin` ou `@capacitor/preferences` com Keystore Android.

2. **Push notifications** — o servidor não envia notificação quando os dados mudam. Implementar exigiria Firebase Cloud Messaging (FCM) integrado ao Capacitor.

3. **Navegação nativa** — cada "tela" no SPA ainda é JavaScript manipulando DOM, não componentes React nativos. Para uma experiência 100% nativa seria necessário migrar para React Native.

4. **APK de debug** — o APK gerado é debug (não assinado para produção). Para publicar na Play Store seria necessário gerar um keystore e assinar com `assembleRelease`.

---

## Como instalar o APK

1. Acessar GitHub → repositório → aba **Actions**
2. Clicar no build mais recente com ✅
3. Baixar o artefato `rios-baterias-debug-N`
4. Extrair o `.apk` e transferir para o celular
5. No celular: Configurações → Segurança → Permitir instalação de fontes desconhecidas
6. Abrir o arquivo `.apk` e instalar
