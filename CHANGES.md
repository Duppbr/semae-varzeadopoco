# CHANGES.md — Rios Baterias
> Documento de referência completo para IAs colaboradoras e devs.
> Cobre todas as alterações feitas desde a versão inicial do projeto.
> Atualizado em: 2026-05-04

---

## Stack Técnica

| Tecnologia | Versão | Observação |
|---|---|---|
| Next.js | App Router (breaking changes) | Leia `node_modules/next/dist/docs/` antes de alterar |
| React | 19 | |
| TypeScript | 5 | strict mode |
| Tailwind CSS | v4 (PostCSS) | Sem `tailwind.config.js` — config via CSS |
| Prisma | 6.19 | ORM com PostgreSQL |
| iron-session | 8 | HTTP-only cookie; exige `SECRET_COOKIE_PASSWORD` no `.env` |
| bcryptjs | — | Hash de senhas |
| lucide-react | — | Todos os ícones — sem emojis no código |
| PWA | — | `manifest.json` + ícones configurados |

---

## Padrões de Código Estabelecidos

### Layout responsivo
```
md:hidden              → visível apenas no mobile
hidden md:block        → visível apenas no desktop
```

### Modais
```tsx
// Bottom sheet mobile / modal centralizado desktop
<div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
  <div className="bg-white w-full md:max-w-Xnl rounded-t-2xl md:rounded-2xl flex flex-col max-h-[92dvh]">
    {/* header flex-shrink-0 */}
    {/* body overflow-y-auto flex-1 */}
    {/* footer flex-shrink-0 */}
  </div>
</div>
```

### Grids responsivos
```tsx
// Filtros: 2 colunas mobile, linha no desktop
<div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">

// Cards de loja: lado a lado a partir de sm (640px)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

// Dados gerais: 2 cols mobile, 4 cols desktop
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

### Regras de negócio fixas
- Roles: `funcionario` | `supervisor` | `admin`
- Lojas: `lojaId=1` = Matriz Artêmia · `lojaId=2` = Filial Iguatemi
- Prioridade: `'verde'` = Baixa · `'amarelo'` = Média · `'vermelho'` = Alta
- `protegido: true` → usuário imune a desativação e exclusão (o "dono" do sistema)
- Não é possível desativar o último admin ativo
- Autorização em todas as rotas: `session.role !== 'admin'` retorna 401

---

## Sessão 1 — Refatoração Mobile de Todas as Páginas Admin

**Contexto**: As páginas admin usavam tabelas com 11–13 colunas. Em mobile causavam scroll horizontal severo e eram inutilizáveis.

**Solução padrão adotada**: Para cada página, criou-se um componente de card mobile e a tabela desktop foi **preservada intacta**. A alternância usa `md:hidden` / `hidden md:block`.

---

### `src/app/admin/produtos/page.tsx`

**Problema**: Tabela de 11 colunas (SKU, Produto, Marca, Amperagem, Tipo, Garantia, Estoque, Preço Cartão, Prioridade, Ativo, Ações).

**Componentes novos criados dentro do arquivo:**

#### `PrioridadeBadge`
Badge reutilizável exibido no card e na tabela.
```tsx
// valores: 'vermelho' | 'amarelo' | 'verde'
// labels:  'Alta'    | 'Média'   | 'Baixa'
// sem emojis — usa bullet • colorido via CSS
```

#### `ProdutoCardMobile`
Substitui a linha de tabela no mobile.
- Header: SKU `font-mono` cinza + nome bold + marca
- Grid 2 colunas: preço cartão (slate-50) + preço à vista (green-50)
- `PrioridadeBadge` no canto superior direito
- Gaveta expansível (`useState(false)`): amperagem, tipo, garantia, estoque, cartão 3x, à vista mínimo
- Rodapé dividido em 3 botões: **Detalhes** (toggle gaveta) | **Ativo/Inativo** | **Editar**

**Outras alterações:**
- `formatReal()` extraído como helper no topo do arquivo
- Filtros: `grid grid-cols-2 md:flex md:flex-wrap gap-2` — elimina overflow horizontal no mobile
- Container: `p-4 md:p-8` — padding reduzido no mobile (antes era só `p-8`)
- Tabela desktop inalterada

---

### `src/app/admin/todas-lojas/page.tsx`

**Problema**: Tabela de 13 colunas comparando Matriz vs Filial lado a lado — impossível no mobile.

**Componente novo:** `LinhaCardMobile`

Estrutura do card:
- Header: SKU `font-mono` + nome (bold) + marca + amperagem/tipo como texto
- Dois blocos coloridos lado a lado:
  - Azul (Matriz): preço cartão + estoque + `PrioridadeBadge`
  - Verde (Filial): preço cartão + estoque + `PrioridadeBadge`
- Gaveta expansível: garantia, CCA, preços à vista de cada loja
- Botão "Editar" inline no canto do header do card

**Desktop:** tabela original preservada sem alterações.

---

### `src/app/admin/aplicacoes/page.tsx`

**Problema**: Edição inline em células de tabela — em mobile é impossível digitar em células estreitas.

**Solução**: Dois estados de edição independentes.

#### `AplicacaoCard` (mobile)
- Header: marca + modelo (bold), ano + tipo de veículo (subtitle)
- Pills coloridos: amperagem (azul) + tipo (slate) + bateria (verde)
- Botões: `Pencil` (abre modal mobile) + `Trash2` (exclui com confirm)

#### `ModalEdicaoMobile`
Bottom sheet com todos os campos como inputs/selects com labels.
- Estado: `appEditandoMobile: Aplicacao | null`
- Campos: marca veículo, modelo, ano de/até, tipo veículo, amperagem, tipo bateria, bateria, bateria alternativa, CCA, dimensões
- Botões: Cancelar + Salvar

**Desktop:** edição inline em células de tabela preservada com estado `editandoId`.

> **Importante**: Os dois estados (`appEditandoMobile` e `editandoId`) são completamente separados para não interferir.

---

### `src/app/admin/usuarios/page.tsx`

**Funcionalidades adicionadas (mobile + desktop):**

#### `UsuarioCard` (mobile)
- Nome + badge laranja "Protegido" quando `usuario.protegido === true`
- Identificador em `font-mono`
- Nome da loja + badge de role + badge de status (ativo/inativo)
- 3 botões de ação: **Resetar senha** | **Ativar / Desativar** | **Excluir**

#### `ModalConfirmarExclusao`
Confirmação de segurança para excluir usuário:
- Exibe o identificador do usuário a ser excluído
- Input onde o admin deve **digitar o identificador exato** para confirmar
- Botão "Excluir" fica `disabled` até `input.value === usuario.identificador`
- Bottom sheet no mobile / modal centralizado no desktop
- Lógica: `const correto = digitado === alvo?.identificador`

**Regra visual:** `podeExcluir = (u) => !u.protegido` — usuários protegidos **nunca** exibem o botão excluir.

**Desktop:** nova coluna "Excluir" adicionada à tabela com ícone `Trash2`.

---

### `src/app/api/admin/usuarios/route.ts`

**Nova função `DELETE` adicionada:**

```typescript
export async function DELETE(req: NextRequest) {
  // 1. Verifica sessão admin
  // 2. Busca usuário pelo id
  // 3. Bloqueia se protegido (403)
  // 4. Bloqueia auto-exclusão — alvo.id === session.userId (403)
  // 5. Executa prisma.usuario.delete
  // 6. Registra auditoria: acao 'usuario_excluido'
}
```

> **Bug histórico**: A função `DELETE` foi inserida com `replace_all: true` e acabou sendo duplicada. Corrigido reescrevendo o arquivo completo com a ferramenta `Write`.

---

### `src/app/admin/opcoes/page.tsx`

**Problema**: Tabela de 3 colunas (ID, Categoria, Valor) — difícil de encontrar e editar valores no mobile.

**Solução**: Grupos por categoria com chips.

#### `GrupoCategoria`
Seção com cabeçalho mostrando nome da categoria + contagem de itens.
- Items como chips (`flex-wrap gap-2`)
- Cada chip: valor + botões `Pencil` (12px) e `Trash2` (12px)
- Botões com `opacity-60 group-hover:opacity-100 transition-opacity`

**Filtro por categoria:**
Scrollable tab bar horizontal — botões: Todas / Marca / Amperagem / Tipo / Garantia / Marca de Veículo.

**Modal de edição:**
`fixed inset-0` bottom sheet com input único + suporte a `Enter` (salva) e `Escape` (cancela).

**Ordem das categorias:**
```ts
const categoriaOrdem = ['marca', 'amperagem', 'tipo', 'garantia', 'marca_veiculo'];
```

---

### `src/app/admin/atalhos/page.tsx`

**Problema**: `draggable` + eventos `onDragStart/onDrop` não funcionam em touch (mobile).

**Solução**: Botões ↑↓ no mobile, drag & drop preservado no desktop.

#### `AtalhoCardMobile`
- Número de posição (font-mono, cinza)
- Info: amperagem + tipo + marca
- Botões `ChevronUp` / `ChevronDown` — desabilitados nas extremidades (`index === 0` / `index === total - 1`)
- Botão `Trash2` para excluir

#### `moverItem(de, para)`
```typescript
const moverItem = async (de: number, para: number) => {
  if (para < 0 || para >= atalhos.length) return;
  const novaLista = [...atalhos];
  const [removido] = novaLista.splice(de, 1);
  novaLista.splice(para, 0, removido);
  setAtalhos(novaLista);
  await salvarPosicoes(novaLista); // mesma função usada no drag & drop desktop
};
```

**Desktop:** tabela com `draggable` + `GripVertical` intacta.

**Formulário de adição:** `grid grid-cols-2 md:flex` com amperagem em `col-span-2` para não ficar estreito demais.

---

## Sessão 2 — Modal de Edição + Indicador de Prioridade

---

### Bug: Prioridade nunca aparecia na Consulta

**Causa raiz:** A rota `/api/produtos-loja` não retornava o campo `prioridade`. As interfaces TypeScript também não tinham o campo. O dado existia no banco mas nunca chegava ao frontend.

**Correção em cadeia (4 arquivos):**

#### 1. `src/app/api/produtos-loja/route.ts`
```typescript
// Adicionado na resposta do map:
prioridade: pl.prioridade,
```

#### 2. `src/app/consulta/[lojaId]/page.tsx`
```typescript
interface ProdutoLojaData {
  // ... campos existentes ...
  prioridade: string; // adicionado
}
```

#### 3. `src/components/ListaProdutos.tsx`
```typescript
interface ProdutoConsulta {
  // ... campos existentes ...
  prioridade: string; // adicionado
}
// E no JSX:
<ProdutoCard {...item} prioridade={item.prioridade} />
```

#### 4. `src/components/ProdutoCard.tsx`
Componente `PrioridadeDot` adicionado:
- Dot `w-2.5 h-2.5 rounded-full` com `ring-2 ring-white`
- `vermelho` → `bg-red-500` + title "Prioridade Alta"
- `amarelo` → `bg-yellow-400` + title "Prioridade Media"
- `verde` → **não renderiza** (não polui o card com indicador de "tudo normal")

---

### `src/components/ModalEditarProduto.tsx` — Redesign Completo

**Problemas anteriores:**
1. Sem bottom sheet no mobile — modal centrado era ruim em telas pequenas
2. Botões de cópia (→ e ←) empilhados em coluna vertical separada entre Matriz e Filial
3. Inputs sem labels — impossível saber qual campo era qual
4. Grid `md:grid-cols-2` com 3 filhos (Matriz, setas, Filial) — layout quebrado no desktop

**Nova estrutura:**
```
fixed inset-0 → items-end md:items-center (bottom sheet mobile)
  bg-white → rounded-t-2xl md:rounded-2xl → max-h-[92dvh] → flex flex-col
    ┌ Header fixo (flex-shrink-0)
    │  SKU (font-mono) + Nome do produto + botão X
    ├ Corpo rolável (overflow-y-auto flex-1)
    │  ┌ Seção: Dados Gerais
    │  │  grid 2 cols mobile / 4 cols desktop
    │  │  SKU (col-1) | Nome (col-3 desktop)
    │  │  Marca | Amperagem | Tipo | CCA | Garantia
    │  └ Seção: Preços por Loja
    │     Botões de cópia [Matriz → Filial] [Filial → Matriz] (HORIZONTAL, lado a lado)
    │     grid-cols-1 sm:grid-cols-2 → lojas lado a lado a partir de 640px
    │     BlocoLoja "Matriz Artemio" (azul) | BlocoLoja "Filial Iguatemi" (verde)
    └ Footer fixo (flex-shrink-0)
       [Cancelar] [Salvar Alteracoes]
```

**Componentes extraídos:**

#### `CampoPreco`
Input de número reutilizável com label, prefixo "R$" flutuante e `step="0.01"`.

#### `BlocoLoja`
Recebe `titulo`, `cor: 'blue'|'green'`, `dados: ProdutoLoja|null`, `onChange`, `onCriar`.
- Header colorido com checkbox "Ativo" no canto direito
- Grid 2×2 de preços (Cartão | Cartão 3x | À vista | À vista min)
- Linha inferior: Estoque + Prioridade (seletor com dot colorido animado ao vivo)
- Se `dados === null`: estado vazio com botão "+ Criar registro"

---

## Sessão 3 — UX de Navegação e Card de Consulta

---

### `src/components/Navbar.tsx` — Ocultar no Admin + Redesign

**Problema:** O `Navbar` era renderizado em **todas** as rotas pelo root layout. Dentro de `/admin`, o `AdminLayout` já tem seu próprio header e sidebar — causando duplo menu.

**Solução:**
```tsx
const pathname = usePathname();
if (pathname.startsWith('/admin')) return null;
```

**Redesign do Navbar (rotas não-admin):**
- Altura reduzida: `h-14` (era `h-16`)
- Logo: `BatteryCharging` em vez de `Battery`
- Links desktop: `hover:bg-slate-50` com transição — mais polido
- Menu mobile: lista nativa com `ChevronRight` em vez de texto com emojis (`🏠 🏢 🏬`)
- Botão hamburguer: `aria-label` correto, transição de ícone Menu↔X
- Sem emojis em nenhum lugar

---

### `src/app/admin/layout.tsx` — Header Mobile + Navegação de Volta

**Problemas corrigidos:**

1. **Duplo menu** — Navbar removido das páginas admin (ver acima)
2. **Header mobile sem contexto** — antes mostrava "Rios Baterias" fixo, sem indicar a página atual
3. **Sem saída do admin no mobile** — depois que o Navbar foi removido, não havia como voltar à consulta no mobile

**Header mobile redesenhado:**
```
[≡ Menu] | [página atual]    | [← Inicio]
          | "Produtos"        |
```
- Título derivado do `pathname` por lookup em `menuItems`
- Botão "← Inicio" (Link para "/") resolve o problema de navegação de volta

**Sidebar — seção "Consulta" adicionada:**
```
─────────────────
CONSULTA
  🏢 Matriz Artemio   → /consulta/1
  🏬 Filial Iguatemi  → /consulta/2
─────────────────
Sair do painel
```
Resolve o acesso à consulta sem precisar do Navbar removido.

**Desktop header:**
- Mostra o título da página atual (antes era sempre "Painel Administrativo")
- Links "Matriz" e "Filial" adicionados ao lado do botão Sair
- Sidebar: `flex flex-col` + `overflow-y-auto` na nav para suportar muitos itens

---

### `src/app/consulta/[lojaId]/page.tsx` — Header Redesenhado

**Antes:** Apenas `<h1>Consulta de Baterias</h1>` sem contexto nem navegação.

**Depois:**
```
[←]  Consulta de precos          [Filial →]
     Matriz Artemio
```

**Implementação:**
```tsx
const lojaInfo = {
  '1': { nome: 'Matriz Artemio', icone: Building2, cor: 'text-blue-600' },
  '2': { nome: 'Filial Iguatemi', icone: Store, cor: 'text-green-600' },
};
```
- Botão `←` (Link para "/") — volta à seleção de loja
- Nome da loja com ícone colorido
- Botão de troca: exibe a outra loja — **visível apenas para `admin`**

---

### `src/components/ListaProdutos.tsx` — Scroll Suave ao Selecionar Filtro

**Problema:** Ao clicar em um atalho ou selecionar um veículo, os resultados apareciam abaixo na página mas o usuário ficava olhando para a seção de filtros.

**Solução:**
```tsx
const resultadosRef = useRef<HTMLElement>(null);

// Em aplicarAtalho() e aplicarVeiculo():
setTimeout(() => {
  resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 80);

// Na seção de resultados:
<section ref={resultadosRef} className="space-y-4 scroll-mt-4">
```

O `setTimeout(80ms)` garante que o React já atualizou o estado antes de executar o scroll.
O `scroll-mt-4` evita que o conteúdo fique colado no topo da tela (considera o header sticky).

**Aplicado em:**
- `aplicarAtalho(a: Atalho)` — clique nos cards de atalho
- `aplicarVeiculo(v: VeiculoSugestao)` — seleção no autocomplete de veículo

---

### `src/components/ProdutoCard.tsx` — Redesign Final

**Problema:** Amperagem e tipo ficavam escondidos no drawer expansível. O usuário precisava expandir cada card para confirmar que a bateria correspondia ao filtro aplicado.

**Nova estrutura visual:**
```
┌─────────────────────────────────┐
│ [60ah] [AGM]          [● dot]   │  ← pills visíveis sem expandir
│ Nome da Bateria Moura            │
│ Marca                            │
├───────────────┬─────────────────┤
│  Cartao       │  A vista         │
│  R$ 399,00    │  R$ 349,00       │
├─────────────────────────────────┤
│  Garantia: 18 meses  [▼ Detalhes]│  ← rodapé clicável
└─────────────────────────────────┘
           ↓ (quando expandido)
┌─────────────────────────────────┐
│ SKU: xxx    CCA: 500            │
│ [Cartão 3x: R$]  [À vista min]  │
│ Estoque: 3 unidades              │
└─────────────────────────────────┘
```

**Detalhes de implementação:**

Pills de características:
```tsx
// Só renderiza a div de pills se houver ao menos um dado
{(produto.amperagem || produto.tipo || prioridade !== 'verde') && (
  <div className="px-4 pt-3.5 flex items-center gap-1.5 flex-wrap">
    {produto.amperagem && <span className="bg-blue-100 text-blue-800 ...">}
    {produto.tipo && <span className="bg-slate-100 text-slate-700 ...">}
    <PrioridadeDot prioridade={prioridade} />
  </div>
)}
```

Rodapé clicável (toda a barra):
```tsx
<div onClick={() => setExpanded(!expanded)} className="... cursor-pointer hover:bg-slate-50">
  <span>Garantia: {produto.garantia}</span>
  <span>[▼ Detalhes] ou [▲ Menos]</span>
</div>
```

Cards de detalhe expandido em grid 2×2 (Cartão 3x | À vista min) com fundo branco e borda.

---

## Índice de Arquivos Alterados

| Arquivo | Sessão | Tipo de mudança |
|---|---|---|
| `src/app/admin/produtos/page.tsx` | 1 | Cards mobile + filtros responsivos |
| `src/app/admin/todas-lojas/page.tsx` | 1 | Card comparativo Matriz/Filial |
| `src/app/admin/aplicacoes/page.tsx` | 1 | Cards + modal de edição mobile |
| `src/app/admin/usuarios/page.tsx` | 1 | Cards + exclusão com confirmação |
| `src/app/api/admin/usuarios/route.ts` | 1 | Rota DELETE com auditoria |
| `src/app/admin/opcoes/page.tsx` | 1 | Chips agrupados por categoria |
| `src/app/admin/atalhos/page.tsx` | 1 | Botões ↑↓ mobile (drag & drop no desktop) |
| `src/app/api/produtos-loja/route.ts` | 2 | Campo `prioridade` na resposta |
| `src/components/ListaProdutos.tsx` | 2+3 | Interface `prioridade` + scroll suave |
| `src/app/consulta/[lojaId]/page.tsx` | 2+3 | Interface `prioridade` + header redesenhado |
| `src/components/ProdutoCard.tsx` | 2+3 | Indicador prioridade + redesign com pills |
| `src/components/ModalEditarProduto.tsx` | 2 | Redesign completo (bottom sheet + lojas lado a lado) |
| `src/components/Navbar.tsx` | 3 | Oculto no admin + redesign visual |
| `src/app/admin/layout.tsx` | 3 | Header mobile com título + seção consulta na sidebar |

---

## Problemas de Ambiente Encontrados

### iron-session — "Missing password"
**Causa:** `.env` existia em `C:\Users\Duppbr\Documents\rios-baterias\.env` mas o dev server rodava a partir do worktree git em `.claude\worktrees\confident-tharp-21bb4f` — sem `.env` local.

**Solução:** Copiar o `.env` para dentro do worktree e reiniciar o servidor a partir do diretório do worktree.

### Processo travado na porta 3000
**Causa:** Servidor anterior ainda rodava.

**Solução:**
```powershell
Stop-Process -Id <PID> -Force
# Em seguida iniciar novo servidor no diretório do worktree
```

---

## Notas Críticas para IAs Colaboradoras

1. **Padrão dual mobile/desktop:** Nunca remova a tabela desktop sem verificar se existe o card mobile equivalente. Os dois coexistem com `md:hidden` / `hidden md:block`.

2. **Autorização:** Todas as rotas API verificam `session.role !== 'admin'`. Não mude esse padrão sem revisão.

3. **Usuários protegidos:** `protegido: true` é o invariante mais importante — esse usuário nunca pode ser desativado ou excluído, nem pelo próprio admin. Sempre bloqueie no backend E oculte o botão no frontend.

4. **Comentários no código:** Mudanças são marcadas com `// MUDANÇA:` seguido de explicação do antes/depois. Isso é essencial para o contexto entre IAs.

5. **Prioridade:** Valores são strings `'verde'` | `'amarelo'` | `'vermelho'`. Nunca use números ou booleanos para isso.

6. **Modais:** Use sempre o padrão bottom sheet (`items-end md:items-center`) para consistência visual entre todas as páginas.

7. **Sem emojis:** O projeto usava emojis (💳 🏠 🚪) que foram removidos. Não reintroduza emojis — use ícones lucide-react.

8. **Worktree path atual:** `C:\Users\Duppbr\Documents\rios-baterias\.claude\worktrees\confident-tharp-21bb4f`
