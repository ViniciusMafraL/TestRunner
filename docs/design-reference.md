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

### `PublishUpdateButton` *(novo, admin-only)*
- Arquivo: `src/components/PublishUpdateButton/PublishUpdateButton.jsx`
- O que é: ferramenta de admin no rodapé da sidebar — "Publicar atualização" (ícone de foguete) avança a **época de sessão** do servidor, forçando todos os outros usuários a relogar. Pede confirmação inline ("Forçar todos a relogar?") antes de disparar e confirma com um `role="status"` discreto. Invisível para quem não é `admin`.

### `OutdatedSessionGate` *(novo)*
- Arquivo: `src/components/OutdatedSessionGate/OutdatedSessionGate.jsx`
- O que é: aviso **bloqueante** ("Nova versão disponível" + botão "Relogar") exibido quando a sessão desta aba é de uma época anterior. Renderizado no `Layout`, fora do `.app-shell`, para cobrir a tela inteira.
- É modal, e não toast, de propósito: nesse estado o backend recusa **todas** as rotas de dados (inclusive leitura), então um aviso passageiro deixaria a pessoa diante de uma tela vazia. Cobrir a tela também satisfaz "bloquear criação/edição até relogar".

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
- Cartão central 380px (`.card`) com a marca Hermit: logo (quadrado violeta com bug, 44px), título "HermitCrab" (`--font-display`) e descrição breve em `--color-gray-600`. Única tela fora do shell.
- **Login exclusivo por e-mail HermitCrab (Google Workspace)**: botão oficial do Google Identity Services no modo real, ou dropdown simulado + "Entrar com Google" no modo mock. Caption cinza avisa que o acesso é restrito à equipe.
- **Login de convidado removido por segurança** (UI e `loginGuest` do `SessionContext`). Sessões somente leitura continuam existindo no modelo (papel/`canWrite`), mas não há mais como criá-las pela tela de login. O endpoint `type: 'guest'` ainda existe na API mock/backend — remover é um passo à parte, no backend.

---

## Parte 3 — Tela Home

- Rota: `/home` · Arquivo: `src/pages/Home/Home.jsx`

### `Home — Cabeçalho`
- `PageHeader` plano; no slot `right`, o botão **"Quadro da operação"** (`.chip-button` como `<a target="_blank">`, ícone de quadro + link externo) seguido da barra de progresso de conclusão (rótulo + barra lime + `count-pill` com %).
- **Quadro da operação**: abre a planilha de report da operação atual no Google Sheets. O link por operação vem de `src/operations/operationBoards.js` (`boardUrlForOperation(id)`, mapa fixo por id em minúsculo: sportia/devops/fortnite/roblox). Operação sem link cadastrado não mostra o botão. Cada operação já guarda seu `spreadsheetId` na aba Operations do controle, então esse mapa pode migrar para `getOperations` no futuro (coluna "BoardUrl").

### `Home — Contadores`
- Três `.card` lado a lado (Abertas/Concluídas/Fechadas) com número em `--font-display`.

### `Home — Tabela de issues abertas`
- Cartão com tabela: Status agora é `StatusPill` (leitura), Severity é `severity-chip`, Version usa `.cell-mono`, Tag é `tag-chip`; Found By usa `AvatarGroup` (pilha de miniaturas). Clicar na linha abre o `IssueDetailModal`.

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
- Células: Status = `StatusPillSelect` (se pode escrever) ou `StatusPill`; Severity = `severity-chip`; Keywords = `keyword-chip`; Tag = `tag-chip`; Version = `.cell-mono`; Attachment = `.attachment-link` (ícone + link truncado, abre em nova aba); Found By = `AvatarGroup`; Title clicável abre o modal.

### `IssueTracker — Colunas ajustáveis` *(novo)*
- **Redimensionar**: alça de 8px na borda direita de cada cabeçalho (`.col-resize-handle`, linha violeta no hover, cursor `col-resize`); arrastar ajusta a largura em todas as tabelas de grupo ao mesmo tempo (CSS vars `--col-<campo>` no container). Colunas flex (Title/Description) viram fixas ao serem redimensionadas.
- **Reordenar**: segurar um cabeçalho por ~200ms ativa o modo de mover (`.th--dragging`, fundo violeta-tint) e arrastar escolhe a posição (indicador `.th--drop-before`/`--drop-after`, linha violeta); soltar move a coluna. Soltar/mover antes do hold = clique normal; Escape cancela.
- **Persistência**: chave `issueTracker.columnLayout.v1` (`{ order, widths }`); botão **"Restaurar padrão"** no menu Columns reseta ordem + larguras.
- Arquivos: `src/components/ColumnHeaderCell/ColumnHeaderCell.jsx` (th + alça), `src/hooks/useColumnLayout.js` (estado persistido), `src/hooks/useColumnReorder.js` (segurar-e-arrastar), `src/utils/columnLayout.js` (lógica pura: merge de ordem salva, clamp de largura, âncora de drop).
- Limitação conhecida: sem auto-scroll da tabela durante o arrasto (role a tabela antes de arrastar). Coluna do checkbox é fixa.

### `IssueTracker — Ordenação por Severity` *(novo)*
- Botão de sort no cabeçalho **Severity** (`.col-sort-btn`, no mesmo `ColumnHeaderCell`): aparece no hover e fica fixo (`.col-sort-btn--active`, violeta) quando há ordenação ativa. Glifos cíclicos: `»«` (padrão, por id) → `»` (mais crítico primeiro) → `«` (menos crítico primeiro).
- Reordena as linhas **dentro de cada grupo de status** (a divisão por grupos continua). É `aria-hidden` e faz `stopPropagation` no pointerdown — não polui o nome acessível do cabeçalho nem dispara o arrasto de reorder.
- **Efêmero**: estado só em memória (`useState`), não persiste; recarregar volta ao padrão por id.
- Ranking de criticidade próprio (diverge do enum): `Compliance › Critical › Major › Normal › Low › Suggestion`. Severity vazia vai ao fim no modo `»`. Lógica pura em `src/utils/issueSort.js` (`sortIssuesBySeverity`, `nextSeveritySort`, `SEVERITY_RANK`).

### `IssueDetailModal`
- Arquivo: `src/components/IssueDetailModal/IssueDetailModal.jsx`
- **Modo leitura (redesenhado — 2 colunas):** `.modal-overlay` + painel `.form-panel.issue-detail-panel.issue-detail-panel--wide` (1040px, cantos `--radius-control`, `max-height: 88vh`, sem cabeçalho próprio — o X mora na coluna direita). Grid `.issue-detail-grid` (`1fr / 360px`):
  - **Coluna principal** (`.issue-detail-main`): linha de pílulas no topo (StatusPill/StatusPillSelect + `severity-chip` + `tag-chip` — o tag é mantido por ser a localização do bug na Sportia) → título grande (`.issue-detail-title`) → **Keywords como chips** logo abaixo do título (`KeywordChips`) → **área rolável** `.issue-detail-scroll` com descrição + `EvidenceGallery` ("Evidências"), que rola sozinha quando a descrição é longa → botão **Editar** (`.issue-detail-actions`) fixo abaixo, sempre visível.
  - **Coluna direita** (`.issue-detail-meta`, divisória à esquerda, rola sozinha): topo `.issue-detail-meta-top` com **chip de ID** mono à esquerda e **Fechar** (X SVG) à direita → rótulo **"Campos"** + linhas `field-row` **sem ícone** (Found By com avatar, Version mono, Platform, Store, Created In, Attachment como link — Keywords saiu daqui, agora vive abaixo do título) → rótulo **"Log"** + `IssueLog`.
  - **`IssueLog`** (`.issue-log`): histórico da issue. Hoje só a entrada **"Report criado"** com a data de `createdIn` (formatada DD/MM/YYYY). O modelo não guarda mudanças de status; as linhas "Fulano mudou o status de X para Y" são **feature futura de backend** (ator + de→para + timestamp) e o layout já as acomoda.
  - Valores vazios aparecem como "—" cinza. Em telas ≤720px as colunas empilham (media query) e a divisória vira separador horizontal.
- **Modo edição (inalterado):** painel único de 640px (`.issue-detail-panel`), cabeçalho com chip de ID + Fechar, formulário empilhado (título/descrição livres + "Fields" com ícones, rodapé Cancelar/Salvar).
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

## Force update (versionamento de sessão)

Ferramenta de admin que obriga todos a relogar — usada ao publicar uma atualização.

- **Modelo**: o servidor mantém uma *época* (contador). O login carimba a sessão com a época vigente (`session.epoch`); o admin avança a época por `POST /system/bump`. Sessão de época anterior = precisa relogar.
- **Sem polling**: a época viaja assinada dentro do próprio token JWT, e o `requireSession` (backend/src/authMiddleware.js) só compara dois inteiros — nenhum I/O por requisição. A descoberta pega carona no primeiro request que a aba já faria (o backend responde `409 OUTDATED_SESSION`), inclusive no carregamento inicial — o que também pega save local/cookie antigo.
- **Fluxo**: `httpClient` vê o código → `src/api/outdatedSession.js` (ponte) → `SessionContext.isOutdated` → `OutdatedSessionGate`. No mock, a detecção entre abas do mesmo browser é pelo evento `storage` da chave `mock_server_epoch`.
- **Quem publica não se autodesloga**: `POST /system/bump` devolve o token do admin já re-assinado com a época nova (`SessionContext.publishUpdate` aplica; no mock, re-carimba local).
- **Persistência**: `backend/.server-epoch.json` (disco do backend local; sobrevive a restart — sem isso um restart devolveria todos à época 1). A pasta `backend/` já é ignorada pelo git.
- Lógica pura compartilhada em `shared/sessionEpoch.js` (`isSessionOutdated`, `normalizeEpoch`, `OUTDATED_SESSION_CODE`) — backend e mock concordam sobre o que é "desatualizada". A comparação é `<` (não `!==`): se a época do servidor regredir, sessões mais novas seguem válidas em vez de expulsar todo mundo.

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
| PublishUpdateButton (admin) | `src/components/PublishUpdateButton/PublishUpdateButton.jsx` |
| OutdatedSessionGate | `src/components/OutdatedSessionGate/OutdatedSessionGate.jsx` |
| Época de sessão (lógica pura) | `shared/sessionEpoch.js` |
| StatusPill / StatusPillSelect | `src/components/StatusPill/StatusPill.jsx` |
| FieldIcons | `src/components/FieldIcons/FieldIcons.jsx` |
| Avatar / AvatarWithLabel / AvatarGroup | `src/components/Avatar/Avatar.jsx` |
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
