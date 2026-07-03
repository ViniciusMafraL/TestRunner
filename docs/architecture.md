# Arquitetura: WorkFlow QA Bug Tracker

Documento técnico separado do README funcional. Cobre a arquitetura desta build (frontend + dados mockados) e os riscos técnicos identificados para a fase seguinte (backend real com Google Sheets), conforme pedido em `projeto.md` e detalhado em `specs/001-qa-bug-tracker/research.md`.

## Visão geral

Monorepo com npm workspaces:

- `shared/` — enums de domínio (`enums.js`), utilitário de comparação de versão tolerante a dado malformado (`version.js`), normalização de enum (`normalize.js`) e helpers de contrato/validação (`contracts.js`). Consumido tanto pelo frontend quanto (na fase futura) pelo backend real.
- `frontend/` — React + Vite + React Router + Axios. Único workspace com lógica de produto implementada nesta build.
- `backend/` — scaffold reservado para a integração real com a Google Sheets API via Service Account. Sem lógica nesta build.

## Fluxo do frontend

```text
main.jsx
  └─ BrowserRouter
       └─ App.jsx
            └─ SessionProvider (auth/SessionContext.jsx)
                 ├─ /login  → Login.jsx (não protegida)
                 └─ ProtectedRoute → Layout (SideMenu + Outlet)
                      ├─ /home          → Home.jsx
                      ├─ /issue-tracker → IssueTracker.jsx
                      ├─ /reporter      → Reporter.jsx
                      ├─ /test-run      → TestRun.jsx
                      └─ /test-plan     → TestPlan.jsx (placeholder)
```

Toda página consome dados exclusivamente através de `frontend/src/api/client.js` (interface única — FR-020), nunca importando `api/mock` ou `api/real` diretamente.

## Fluxo do "backend" (mock nesta build)

```text
client.js (VITE_API_MODE=mock|real)
  └─ mock/index.js
       ├─ auth.js       → valida contra shared/contracts.js + shared/enums.js (FoundBy)
       ├─ home.js       → agrega store.js usando shared/enums.js (StatusGroup) e shared/version.js
       ├─ issues.js     → agrupamento via utils/groupByStatus.js; simula 409 para BUG-002
       └─ testRuns.js   → valida contra shared/contracts.js
            └─ store.js (array em memória, seed com casos "sujos": BUG-007 status
               fora do enum, BUG-008 versão malformada)
```

A implementação `real/` (Axios) já existe com a mesma assinatura de função de `mock/`, batendo contra os endpoints descritos em `contracts/api.md` — é a que entra em uso quando `VITE_API_MODE=real`, sem tocar em nenhuma tela.

## Riscos técnicos e mitigações

### 1. Limites de quota da API do Google Sheets (fase futura)

**Risco**: a Google Sheets API tem cotas de leitura/escrita por minuto por projeto; uma equipe pequena não deve esbarrar nisso em uso normal, mas polling agressivo ou N chamadas por render pode estourar.
**Mitigação planejada**: o backend real deve agregar leituras (uma leitura da planilha inteira por requisição de listagem, nunca uma leitura por linha) e cachear em memória por um TTL curto; escritas devem ser em lote quando possível.

### 2. Consistência de cache

**Risco**: se o backend cachear a planilha em memória, duas instâncias do backend (ou um cache mal invalidado) podem servir dados desatualizados após uma escrita.
**Mitigação planejada**: invalidar o cache imediatamente após qualquer escrita bem-sucedida; se houver múltiplas instâncias do backend, mover para um cache compartilhado (ex. Redis) ou aceitar leitura direta da planilha por enquanto, dado o volume pequeno de dados.

### 3. Integridade de escrita concorrente por ID

**Risco**: duas edições simultâneas do mesmo `ID` (ex. duas pessoas mudando o status da mesma issue) podem se sobrescrever silenciosamente numa API baseada em planilha (não há transação nativa).
**Mitigação planejada**: escrita otimista com verificação de versão/timestamp da linha antes de gravar (last-write-wins documentado, não silencioso); nesta build o mock já simula uma falha de gravação determinística (`BUG-002`) para validar que o frontend reverte corretamente (FR-010).

### 4. Segurança da autenticação

**Risco** (documentado em `research.md` §3): nesta build, os "5 logins fixos" são validados inteiramente no cliente, sem cofre de credenciais nem hashing — aceitável apenas porque o propósito desta fase é validar a UI antes do backend existir.
**Mitigação obrigatória antes de expor a ferramenta fora da rede da equipe**: mover toda validação de credencial para o backend real na fase seguinte; o cliente nunca deve voltar a guardar a lista de usuários válidos.

### 5. Tolerância a dados fora do enum

**Risco**: a planilha real pode conter valores de `Status`, `Version` etc. fora do enum esperado (erro de digitação manual, migração antiga).
**Mitigação já implementada nesta build**: `groupByStatus.js` sempre cria um grupo "não reconhecido"; `home.js` exclui esses status dos 3 contadores sem quebrar a tela; `version.js` (`parseVersion`/`compareVersions`) trata qualquer versão malformada como "menor que qualquer versão válida" em vez de lançar erro. Ver `frontend/src/api/mock/store.js` (`BUG-007`, `BUG-008`) para os casos de teste correspondentes.

## O que fica para a fase de backend real

- Implementar `backend/src/api` e `backend/src/services` contra a Google Sheets API (Service Account), seguindo exatamente `specs/001-qa-bug-tracker/contracts/api.md`.
- Mover a validação de login para o servidor.
- Implementar as mitigações de quota/cache/concorrência acima.
- Trocar `VITE_API_MODE` para `real` no ambiente de produção do frontend — nenhuma mudança de código de tela é esperada (FR-020).
