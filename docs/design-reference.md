# Referência de Design — QA TestRunner

Documento de apoio para pedir edições visuais específicas. Cada componente/bloco tem um nome fixo — ao pedir uma mudança, referencie o nome (ex.: "no `PageHeader` da Issue Tracker, troque a cor de fundo") para eu localizar o arquivo certo sem precisar redescrever o app inteiro.

Fonte única de verdade do estilo: `src/styles/tokens.css` (CSS puro com custom properties — sem Tailwind, sem CSS-in-JS, sem lib de componentes).

> **Redesign (julho/2026):** o app migrou do visual "canvas lime + cartões flutuantes" para um layout plano de fundo branco: sidebar de altura total com divisor, título de página simples com busca ao lado, grupos de status em containers com borda, status como pílulas coloridas, chips de Severity/Keywords/Tag, e formulário/modal estilo "task creator" (título livre + seção Fields em linhas).

---

## Parte 0 — Fundamentos (Design Tokens)

Tudo abaixo vem do bloco `:root` de `src/styles/tokens.css`.

### Cores — Marca
| Token | Valor | Uso |
|---|---|---|
| `--color-lime` | `#c4e64a` | Destaque primário: botão primário, item de nav ativo, FAB |
| `--color-lime-soft` | `#eef6c8` | Reserva (era o fundo do antigo banner de página) |
| `--color-violet` | `#7c3aed` | Destaque secundário: marca do logo, dot de "Open Issues", loading |
| `--color-violet-soft` | `#ede9fe` | Fundo do botão secundário, `tag-chip`, foco da busca |

### Cores — Neutros
| Token | Valor | Uso |
|---|---|---|
| `--color-ink-900` | `#18181b` | Texto principal |
| `--color-gray-600` | `#6b7280` | Texto secundário/labels |
| `--color-gray-400` | `#9ca3af` | Placeholders, valores vazios ("—"), fallback do Avatar |
| `--color-border-200` | `#e7e7e1` | Bordas (inputs, tabelas, containers, divisor da sidebar) |
| `--color-surface` | `#f4f4f2` | Cartão de sessão da sidebar, `count-pill`, chip de ID |
| `--color-surface-50` | `#fafafa` | Faixa do `thead` nas tabelas de grupo |
| `--color-white` | `#ffffff` | Superfícies |
| `--color-canvas` | `#ffffff` | Fundo geral do app (era lime `#cddc5a` antes do redesign) |

### Cores — Status por valor (pílulas e dots)
Cada status individual tem um par tint/dot (`--status-<slug>-bg` / `--status-<slug>-dot`). Mapeamento status → slug em `src/utils/statusCategory.js` (`issueStatusSlug`):

| Status (enum) | Slug | Dot | Tint |
|---|---|---|---|
| Open | `open` | `#7c3aed` violeta | `#ede9fe` |
| To review | `review` | `#ec4899` rosa | `#fce7f3` |
| In progress | `progress` | `#3b82f6` azul | `#dbeafe` |
| By Design | `bydesign` | `#14b8a6` teal | `#ccfbf1` |
| Fixed / Done | `validated` | `#22c55e` verde | `#dcfce7` |
| Closed | `closed` | `#f97316` laranja | `#f4f4f5` |
| Won't fix | `wontfix` | `#9ca3af` cinza | `#f4f4f5` |
| (não reconhecido) | `desconhecido` | `#ef4444` vermelho | `#fee2e2` |

`--color-status-error: #ef4444` segue sendo a cor de textos de erro em toda a app. O quadro Test Run mantém paleta própria (`--color-status-blue/yellow/green` → classes `.status-dot--run-*`).

### Cores — Severity (chips)
| Severity | Texto | Fundo |
|---|---|---|
| Critical | `#dc2626` | `#fee2e2` |
| Major | `#d97706` | `#fef3c7` |
| Compliance | `#2563eb` | `#dbeafe` |
| demais (Normal, Low, Suggestion) | `#52525b` | `#f4f4f5` |

### Tipografia
- Família: `--font-family-base: 'Plus Jakarta Sans', 'General Sans', …, sans-serif`; mono: `--font-family-mono` (Version, ID).
- Escala: `--font-display` (`800 34px`) · `--font-heading-2` (`700 28px`) · `--font-heading-3` (`600 18px`) · `--font-body` (`500 15px`) · `--font-label` (`500 13px`) · `--font-caption` (`600 12px`).
- Cabeçalhos de tabela (`th`) agora são **uppercase** com `--tracking-caption`.

⚠️ **Risco**: `'Plus Jakarta Sans'` continua sem ser carregada (sem `@font-face`/link) — cai para a sans-serif do sistema.

### Espaçamento / Raios / Elevação
- Espaço base 4px: `--space-1..8` = 4, 8, 12, 16, 24, 32, 40, 56px.
- Raios: `chip 8` · `control 12` · `list-item 16` (containers/grupos/FAB) · `card 20` · `card-lg 24` · `pill 999`.
- `--shadow-card` só permanece em `.card` (Test Run, Login), Loading e FAB — os containers novos usam **borda** em vez de sombra.

### Classes utilitárias novas do redesign
`.chip-button` (botão branco com borda e ícone — Filters/Columns) · `.stat-chip`/`.stat-chip-dot` (estatística com ponto colorido) · `.search-pill` (busca em pílula com ícone) · `.status-pill`/`.status-pill--<slug>`/`.status-pill-dot` (+ `<select>` embutido estilizado) · `.severity-chip--<slug>` · `.keyword-chip` · `.tag-chip` · `.attachment-link` · `.cell-mono` · `.issue-group`/`.issue-group-header` · `.form-panel`/`.form-panel-body`/`.form-title-input`/`.form-desc-input`/`.fields-label`/`.field-row`/`.field-label`/`.field-control`/`.form-more-toggle`/`.form-footer` · `.modal-overlay` · `.issue-detail-panel`/`-header`/`-id`/`-close`/`-title`/`-pills`/`-description`/`.field-value`.

### Modo escuro
- Mecanismo: atributo `data-theme="dark"|"light"` na raiz (`<html>`). Inicializado em `src/main.jsx` (localStorage `theme` > preferência do sistema); alternado pelo botão "Modo escuro/claro" no rodapé da sidebar via hook `src/hooks/useTheme.js` (persiste no localStorage).
- Overrides em `:root[data-theme='dark']` no `tokens.css` — só tokens são redefinidos, componentes não têm CSS específico de tema.
- Paleta escura (slate): fundo `#0F172A` (`--color-canvas`), painéis/tabelas/inputs `#1E293B` (`--color-white` vira cor de superfície), superfícies elevadas `#334155` (`--color-surface`), faixa de thead `#253147`, borda padrão `#334155`, texto `#F1F5F9`/`#94A3B8`/`#64748B`.
- **A sidebar é clara (`#F2F4F6`) só no tema claro** — no escuro ela acompanha os painéis (`#1E293B`) com texto claro. Os tokens `--sidebar-bg/text/text-muted/border/card-bg` apontam para os tokens de superfície/texto gerais (`--color-white`, `--color-ink-900` etc.), então não precisam de override próprio no bloco `[data-theme='dark']` — só existem para permitir divergir no futuro, se necessário.
- Pílulas de status e chips de severity usam **tints translúcidos** (rgba) com textos clareados no escuro; tag-chip/botão secundário/links violeta clareiam para `#c4b5fd`/`#a78bfa`; verde de sucesso vira `#4ade80` (`--text-success`).
- Textos sobre fundos coloridos fixos (avatar, marca do logo, nav ativa lime) usam brancos/pretos literais para não inverterem com o tema.

### Observações gerais
1. **Sem responsividade** (`@media` zero; shell fixo `260px 1fr`; tabelas com `overflow-x`).
2. **Modais**: os três (`IssueDetailModal`, `TestRunForm`, `ColumnVisibilityMenu`) compartilham o overlay `.modal-overlay`; os corpos de `TestRunForm`/`ColumnVisibilityMenu` seguem no estilo `.card`.

---

## Parte 1 — Estrutura Global / Shell

### `Layout`
- Arquivo: `src/components/Layout/Layout.jsx`
- O que é: grid `260px 1fr` de fundo branco; conteúdo com padding `--space-6` (`.app-content`).

### `SideMenu`
- Arquivo: `src/components/SideMenu/SideMenu.jsx`
- O que é: sidebar de **altura total** com borda à direita — clara (`#F2F4F6`) no tema claro, e `#1E293B` (mesma cor dos painéis) com texto claro no tema escuro. De cima para baixo: logo (quadrado violeta com ícone de bug + "Qa TestRunner"), lista de navegação com **ícones SVG de linha** (Home, Test Run, Issue Tracker, Test Plan, Report), e rodapé (`.app-sidebar-footer`) com divisor, botão **Modo escuro/claro** (lua/sol, alterna o tema), botão **Logout** (ícone + texto) e cartão de sessão (`.app-session-card`: avatar + nome + papel em uppercase).
- Item ativo: pílula lime (`.app-nav-link.active`, raio `--radius-pill`).
- O campo de busca saiu da sidebar (foi para o cabeçalho da Issue Tracker).

### `PageHeader`
- Arquivo: `src/components/PageHeader/PageHeader.jsx`
- O que é: cabeçalho **plano** (sem banner de fundo): título `--font-display` à esquerda + slot `right` (busca na Issue Tracker, progresso na Home, botão no Test Run).

### `Loading` / `ErrorBoundary`
- Arquivos: `src/components/Loading/Loading.jsx`, `src/components/ErrorBoundary/ErrorBoundary.jsx` — inalterados (dots pulsantes; cartão de fallback).

### `FloatingActionButton`
- Arquivo: `src/components/FloatingActionButton/FloatingActionButton.jsx`
- O que é: botão fixo lime no canto inferior direito, agora com ícone de prancheta + rótulo (usado na Issue Tracker como **"New Report"**), raio `--radius-list-item`.

### `Dropdown` *(novo)*
- Arquivo: `src/components/Dropdown/Dropdown.jsx`
- O que é: dropdown próprio do design system que substitui **todos** os `<select>` nativos do app (o popup do navegador não seguia o tema). Botão gatilho (`.dropdown-trigger`, visual de input) + listbox estilizada (`.dropdown-menu`/`.dropdown-option`, com estados highlighted/selected). Acessível (padrão ARIA combobox/listbox, setas/Enter/Escape) e com popup em `position: fixed` para não ser cortado por tabelas roláveis/modais.
- Usado em: Login (nome fixo), Reporter (todos os selects), TestRunForm (tipo/plataforma), e como base do `StatusPillSelect`.
- Personalizável via `triggerClassName`, `renderValue` e `renderOption`.

### `Checkbox` *(novo)*
- Arquivo: `src/components/Checkbox/Checkbox.jsx`
- O que é: substitui **todos** os `<input type="checkbox">` visíveis do app pelo mesmo motivo do `Dropdown` — a caixa nativa do navegador não segue os tokens do projeto (borda/fundo do SO, principalmente destoante no modo escuro). Mantém um `<input>` nativo escondido (`.checkbox`) por trás de uma caixa customizada (`.checkbox-box`, 16px, cantos arredondados) para preservar teclado/leitor de tela; marcado fica com fundo violeta + check branco. Sem `children` renderiza só a caixa (cabeçalhos de tabela); com `children`, vira um item clicável (`.checkbox-row`) com o rótulo ao lado.
- Usado em: seleção em lote da Issue Tracker (checkbox do cabeçalho de grupo + de cada linha) e no `ColumnVisibilityMenu` (checklist de colunas).

### `StatusPill` / `StatusPillSelect` *(novo)*
- Arquivo: `src/components/StatusPill/StatusPill.jsx`
- O que é: pílula de status (fundo tingido + ponto colorido + rótulo). `StatusPillSelect` usa o `Dropdown` com o gatilho estilizado como pílula e opções com ponto colorido por status; `onChange` recebe o valor direto.
- Usado em: Home (leitura), Issue Tracker (leitura/edição), IssueDetailModal.

### `FIELD_ICONS` *(novo)*
- Arquivo: `src/components/FieldIcons/FieldIcons.jsx`
- O que é: mapa de ícones SVG 14px por campo de issue (version, severity, foundBy, platform, tag, keywords, store, attachment, createdIn) — compartilhado entre Reporter e IssueDetailModal.

---

## Parte 2 — Tela Login

- Rota: `/login` · Arquivo: `src/pages/Login/Login.jsx`
- Inalterada no redesign: cartão central 360px (`.card`) com título "✦HermitCrab", dois formulários (membro/convidado) e erro condicional. Única tela fora do shell.

---

## Parte 3 — Tela Home

- Rota: `/home` · Arquivo: `src/pages/Home/Home.jsx`

### `Home — Cabeçalho`
- `PageHeader` plano com barra de progresso de conclusão no slot `right` (rótulo + barra lime + `count-pill` com %).

### `Home — Contadores`
- Três `.card` lado a lado (Abertas/Concluídas/Fechadas) com número em `--font-display`.

### `Home — Tabela de issues abertas`
- Cartão com tabela: Status agora é `StatusPill` (leitura), Severity é `severity-chip`, Version usa `.cell-mono`, Tag é `tag-chip`; Found By segue `AvatarWithLabel`. Clicar na linha abre o `IssueDetailModal`.

---

## Parte 4 — Tela Issue Tracker

- Rota: `/issue-tracker` · Arquivo: `src/pages/IssueTracker/IssueTracker.jsx`

### `IssueTracker — Cabeçalho`
- `PageHeader` com título à esquerda e **busca em pílula** (`.search-pill`, ícone de lupa, placeholder "Buscar por Title ou ID") ocupando o restante da linha.

### `IssueTracker — Barra de ferramentas`
- Linha inline na página: botão **Filters** (`.chip-button`, ainda decorativo — sem funcionalidade), botão **Columns** (`ColumnVisibilityMenu`), e à direita os **stat chips** "N Open Issues" (dot violeta) e "N Critical" (dot vermelho), calculados dos dados carregados.

### `ColumnVisibilityMenu`
- Arquivo: `src/components/ColumnVisibilityMenu/ColumnVisibilityMenu.jsx`
- Gatilho agora é `.chip-button` com ícone de colunas e rótulo **"Columns"**; o modal checklist interno segue igual (overlay inline + `.card`).

### `IssueTracker — Grupos por status`
- Uma `<section class="issue-group">` por status: container branco com **borda** e raio 16, cabeçalho colapsável (`.issue-group-header`: chevron + dot do status via `.status-dot--<slug>` + nome + `count-pill` cinza) e tabela com `thead` em faixa `--color-surface-50`.
- Células: Status = `StatusPillSelect` (se pode escrever) ou `StatusPill`; Severity = `severity-chip`; Keywords = `keyword-chip`; Tag = `tag-chip`; Version = `.cell-mono`; Attachment = `.attachment-link` (ícone + link truncado, abre em nova aba); Found By = `AvatarWithLabel`; Title clicável abre o modal.

### `IssueDetailModal`
- Arquivo: `src/components/IssueDetailModal/IssueDetailModal.jsx`
- O que é (redesenhado): `.modal-overlay` + painel `.form-panel.issue-detail-panel` (640px, corpo rolável). Cabeçalho com **chip de ID** mono + botão fechar (X SVG). Corpo: título grande, linha de pílulas de resumo (StatusPill/StatusPillSelect + severity-chip + tag-chip), descrição em texto corrido. Depois, seção **"Fields"** em linhas `field-row` com ícone + rótulo + valor (Found By com avatar, Version mono, Platform, Keywords chip, Store, Created In, Attachment como link). Valores vazios aparecem como "—" cinza.
- Usado em: Home e Issue Tracker.

### `FloatingActionButton`
- Label **"New Report"**, aponta para `/reporter`.

---

## Parte 5 — Tela Reporter

- Rota: `/reporter` · Arquivo: `src/pages/Reporter/Reporter.jsx`

### `Reporter — Formulário de nova issue` *(redesenhado, estilo "task creator")*
- `form.form-panel` (container com borda, máx. 720px):
  - **Corpo superior**: input de título grande sem borda (`.form-title-input`, placeholder "Título da issue", obrigatório) + textarea de descrição sem borda (`.form-desc-input`).
  - **Seção "Fields"** (`.fields-label` + linhas `.field-row` com ícone/rótulo à esquerda e controle à direita): Version* (obrigatório, placeholder 0.0.0), Severity, Found By, Platform.
  - **"Mais campos"** (`.form-more-toggle`): revela Tag, Keywords, Store e Attachment — recolhidos por padrão.
  - **Rodapé** (`.form-footer`): mensagens de sucesso (verde)/erro (vermelho) à esquerda, botão primário "Enviar" à direita.
- Convidado (somente leitura): `PageHeader` + `form-panel` com aviso, sem formulário.

---

## Parte 6 — Tela Test Run

- Rota: `/test-run` · Arquivo: `src/pages/TestRun/TestRun.jsx`
- **Não redesenhada** (mantém o estilo de cartões com sombra): `PageHeader` + botão "Nova demanda", grid de 3 colunas `.card` com `StatusDot` (classes `--run-*`), `TestRunCard` arrastável e `TestRunForm` (modal inline antigo).

---

## Parte 7 — Tela Test Plan

- Rota: `/test-plan` · Arquivo: `src/pages/TestPlan/TestPlan.jsx`
- Stub "Em breve" (`PageHeader` + `.card`).

---

## Índice rápido de arquivos

| Tela/Componente | Arquivo |
|---|---|
| Rotas | `src/App.jsx` |
| Design tokens | `src/styles/tokens.css` |
| Layout (shell) | `src/components/Layout/Layout.jsx` |
| SideMenu | `src/components/SideMenu/SideMenu.jsx` |
| PageHeader | `src/components/PageHeader/PageHeader.jsx` |
| Dropdown | `src/components/Dropdown/Dropdown.jsx` |
| Checkbox | `src/components/Checkbox/Checkbox.jsx` |
| StatusPill / StatusPillSelect | `src/components/StatusPill/StatusPill.jsx` |
| FieldIcons | `src/components/FieldIcons/FieldIcons.jsx` |
| Avatar / AvatarWithLabel | `src/components/Avatar/Avatar.jsx` |
| StatusDot (Test Run) | `src/components/StatusDot/StatusDot.jsx` |
| Loading | `src/components/Loading/Loading.jsx` |
| ErrorBoundary | `src/components/ErrorBoundary/ErrorBoundary.jsx` |
| FloatingActionButton | `src/components/FloatingActionButton/FloatingActionButton.jsx` |
| TestRunCard | `src/components/TestRunCard/TestRunCard.jsx` |
| TestRunForm | `src/components/TestRunForm/TestRunForm.jsx` |
| IssueDetailModal | `src/components/IssueDetailModal/IssueDetailModal.jsx` |
| ColumnVisibilityMenu | `src/components/ColumnVisibilityMenu/ColumnVisibilityMenu.jsx` |
| Mapeamento status→slug | `src/utils/statusCategory.js` |
| Tema (hook) | `src/hooks/useTheme.js` |
| Tema (inicialização) | `src/main.jsx` |
| Login | `src/pages/Login/Login.jsx` |
| Home | `src/pages/Home/Home.jsx` |
| Issue Tracker | `src/pages/IssueTracker/IssueTracker.jsx` |
| Reporter | `src/pages/Reporter/Reporter.jsx` |
| Test Run | `src/pages/TestRun/TestRun.jsx` |
| Test Plan | `src/pages/TestPlan/TestPlan.jsx` |
