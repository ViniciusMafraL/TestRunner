# TestRunner — Análise do projeto e propostas de melhoria

> Gerado em 2026-07-06 a partir de uma análise completa do repositório: código-fonte (`src/`, `backend/`, `shared/`), specs (`specs/001-qa-bug-tracker`, `specs/002-ux-improvements`), constituição (`.specify/memory/constitution.md`), configuração de build/testes e histórico do git.

## Como o projeto funciona hoje

O desenvolvimento segue o fluxo **Spec-Kit**: cada funcionalidade nasce como uma spec numerada em `specs/`, passa por planejamento (`plan.md` com Constitution Check, `research.md`, `data-model.md`, `contracts/`) e vira uma lista de tarefas (`tasks.md`) executada até a conclusão. A constituição em `.specify/memory/constitution.md` define os princípios que todo plano precisa validar (test-first, separação frontend/backend, contract-first, YAGNI).

Esse fluxo **está funcionando bem**: as duas features (001 e 002) foram concluídas com 100% das tarefas marcadas (63 + 35), a suíte de testes está verde (64/64 no Vitest, mais e2e no Playwright), e as decisões técnicas registradas nos planos (mock trocável por flag, zero dependências novas na 002) foram respeitadas no código.

A arquitetura real:

- **Frontend** React 18 + Vite na **raiz** do repositório (`src/`), com camada de API única (`src/api/client.js`) que alterna entre mock em memória e HTTP real via `VITE_API_MODE`.
- **Backend** Express em `backend/`, integrado ao Google Sheets via Service Account, exposto por um túnel `trycloudflare.com`.
- **Shared** (`shared/`) com enums e contratos, ligado ao frontend por um **symlink manual** em `node_modules/shared`.
- **Deploy** do frontend no GitHub Pages via `npm run deploy` (gh-pages), manual.

---

## 🔴 Prioridade 0 — Riscos de perda de trabalho (corrigir já)

### 1. O `.gitignore` está ignorando o backend inteiro

A linha 9 do `.gitignore` contém `/backend`. Os 16 arquivos atuais do backend só estão no git porque foram adicionados antes (ou à força) — **qualquer arquivo novo criado em `backend/` é silenciosamente ignorado** e nunca será commitado:

```
$ git check-ignore -v backend/src/newfile.js
.gitignore:9:/backend    backend/src/newfile.js
```

Uma rota nova, um repository novo ou os futuros testes do backend seriam perdidos num clone ou troca de máquina sem nenhum aviso.

**O que fazer:** remover a linha `/backend` do `.gitignore`. Os segredos do backend já estão protegidos pelas regras `secrets/`, `*-key*.json` e `.env*`, que é o que a linha provavelmente tentava cobrir.

### 2. Todo o planejamento está fora do versionamento

`specs/`, `.specify/` e `.claude/` estão no `.gitignore`. Isso significa que **as specs, os planos, as listas de tarefas e a própria constituição existem apenas nesta máquina**. Se o disco falhar, todo o histórico de decisões do projeto some — e é exatamente esse material que orienta as próximas features.

**O que fazer:** remover `specs/` e `.specify/` do `.gitignore` e commitá-los. São markdown puro, sem segredos (verificado). `.claude/settings.local.json` pode continuar ignorado, mas `.claude/skills/` vale versionar.

### 3. Backend sem nenhum teste automatizado

`backend/tests/` está vazio e `backend/package.json` não tem sequer um script `test`. Isso viola diretamente o Princípio I da constituição (*Test-First, NON-NEGOTIABLE*) — e o backend é justamente a camada com mais risco real (parse de linhas da planilha, escrita por ID, dados fora do enum).

**O que fazer:** começar pelo que já é puro e testável sem rede: `googleSheets.js` (mapeamento linha↔objeto), os repositories (com o client do Sheets mockado) e os handlers de rota via `supertest` contra o `app.js`. Os contratos em `specs/001-qa-bug-tracker/contracts/api.md` já dizem exatamente o que validar — os testes de contrato do frontend podem ser reaproveitados como base.

---

## 🟡 Prioridade 1 — Fricções no dia a dia

### 4. O monorepo prometido não existe — e um clone limpo não funciona

`projeto.md` e os planos descrevem npm workspaces (`shared/`, `frontend/`, `backend/`), mas o `package.json` da raiz **não tem o campo `workspaces`**, a pasta `frontend/` está vazia, e a dependência `"shared": "*"` só resolve porque existe um symlink criado à mão em `node_modules/shared`. Num clone novo, `npm install` tentaria baixar o pacote público `shared` do registro npm — o build quebraria (ou pior, instalaria código de terceiros).

**O que fazer (opção simples, recomendada):** aceitar a estrutura atual (frontend na raiz) e declarar workspaces apenas para o que existe:

```json
"workspaces": ["shared", "backend"]
```

Com isso o npm cria o link de `shared` automaticamente, `npm install` na raiz instala tudo, e a pasta `frontend/` vazia pode ser apagada. Atualizar `projeto.md` para refletir a estrutura real (frontend na raiz) fecha a divergência entre documentação e realidade.

### 5. Nenhum CI — a constituição não é aplicada por ninguém

A constituição proíbe merge com testes quebrados, mas não há `.github/workflows/`. Tudo é commitado direto na `main` (os planos citam branches `001-qa-bug-tracker` e `002-ux-improvements`, mas elas nunca existiram), com mensagens como "update" e "build".

**O que fazer:** um workflow mínimo de ~20 linhas rodando `npm ci`, `npm run lint` e `npm test` em cada push/PR já dá rede de segurança. Quando o backend tiver testes (item 3), incluí-los. Adotar branch por feature + PR é opcional para uma pessoa só, mas o CI no push custa quase nada e pega regressão na hora.

### 6. `dist/` está commitado na `main`

O build de produção (`dist/index.html`, JS e CSS com hash) está versionado, gerando commits ruidosos ("build") e diffs ilegíveis. O `gh-pages` já publica a partir da pasta local — não precisa dela no git.

**O que fazer:** `git rm -r --cached dist` e adicionar `dist/` ao `.gitignore`. Melhor ainda: mover o deploy para o GitHub Actions (deploy automático do Pages a cada push na `main`), eliminando o `npm run deploy` manual.

### 7. O backend vive atrás de um túnel descartável

`VITE_API_BASE_URL` aponta para `*.trycloudflare.com` — uma URL que **muda a cada reinício do túnel**. O ciclo atual é: reiniciar túnel → editar `.env` → rebuild → redeploy do frontend. É a maior fricção operacional do projeto.

**O que fazer:** hospedar o backend em um serviço com URL estável e tier gratuito (Render, Railway, Fly.io — o app Express + googleapis roda em qualquer um). Alternativa sem custo de migração: Cloudflare Tunnel nomeado (gratuito, exige domínio), que mantém URL fixa. Qualquer uma das duas elimina o ciclo de rebuild.

---

## 🟢 Prioridade 2 — Documentação e higiene

### 8. README de 2 linhas e arquitetura prometida que não existe

O README não diz como rodar o projeto; o quickstart real está em `specs/*/quickstart.md` (hoje fora do git, item 2). O `projeto.md` exige um documento de arquitetura com riscos e mitigações, e o próprio `.gitignore` referencia `docs/architecture.md` — que não existe.

**O que fazer:** README com: pré-requisitos, `npm install`, como rodar frontend (`npm run dev` + `VITE_API_MODE`), backend (`.env` com credenciais, `npm run dev` em `backend/`), testes e deploy. Criar `docs/architecture.md` consolidando o que já está escrito em `research.md` das specs (quota do Sheets, integridade de escrita por ID, autenticação client-side, tolerância a enum inválido) — o conteúdo já existe, só está espalhado.

### 9. Constituição com buracos

O corpo do documento pula os princípios **IV** (inexistente) e **VI** (o Sync Impact Report do topo declara "VI. Observabilidade e Rastreabilidade" como definido, mas a seção não existe no corpo). Além disso, o Princípio V (RBAC com times/projetos isoláveis) descreve um sistema muito maior que o real (5 usuários fixos + convidado, validados no cliente) — todo plano precisa registrar ressalva contra um requisito que não é o do produto.

**O que fazer:** emendar a constituição (processo de emenda já previsto nela): ou escrever o princípio VI ou removê-lo do report; renumerar ou documentar a ausência do IV; recalibrar o V para o modelo de dois papéis que o produto realmente tem, mantendo a exigência de mover a validação para o servidor como meta da fase backend.

### 10. Limpezas rápidas

- **`tmp-screenshot-real.mjs`** na raiz: script temporário de screenshot, commitado. Apagar.
- **`.gitignore` conflitante:** `.env.test` aparece três vezes (ignora, des-ignora com `!.env.test`, ignora de novo na última linha — e a última vence). Como `.env.test` só contém `VITE_API_MODE=mock`, o mais simples é versioná-lo de fato e deixar uma única regra `!.env.test`.
- **`frontend/` vazia:** apagar (coberto pelo item 4).
- **Criar `CLAUDE.md`** na raiz com o essencial (estrutura real do repo, fluxo speckit, comando de teste, regra de nunca commitar `secrets/`), para que sessões futuras do Claude Code não precisem redescobrir tudo.

---

## Ordem sugerida de execução

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Tirar `/backend`, `specs/`, `.specify/` do `.gitignore` e commitar | minutos | Elimina risco de perda de código e de todo o planejamento |
| 2 | `workspaces` no package.json raiz + apagar `frontend/` vazia | minutos | Clone limpo volta a funcionar |
| 3 | Remover `dist/` do git + limpar `tmp-screenshot-real.mjs` e `.gitignore` | minutos | Histórico limpo |
| 4 | CI (lint + vitest) no GitHub Actions | ~1h | Constituição passa a ser aplicada automaticamente |
| 5 | Testes do backend (contrato + unidades puras) | 1–2 dias | Fecha a maior violação da constituição |
| 6 | README + `docs/architecture.md` | ~2h | Onboarding e exigência do projeto.md |
| 7 | Backend com URL estável | ~2h | Mata o ciclo túnel→.env→rebuild→redeploy |
| 8 | Emenda da constituição (IV/VI/V) | ~1h | Planos futuros sem ressalvas falsas |

Os itens 1–3 são um único commit de higiene e podem ser feitos hoje. Os itens 4–5 são a base para qualquer feature nova (`003-...`) já nascer com a rede de segurança que a constituição promete.
