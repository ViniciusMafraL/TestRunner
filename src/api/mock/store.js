// Store do mock, multi-operação e agora multi-projeto. "Projeto = aba" da
// planilha: cada operação tem projectsData[projeto] com as issues daquele
// projeto (sequência BUG-### própria) e as evidências. Test Runs continuam por
// operação. A operação e o projeto atuais são lidos do mesmo localStorage que o
// httpClient real usa (headers X-Operation / X-Project), então a interface
// `api` não muda entre mock e real — só o dado servido depende da seleção.

export const CURRENT_OPERATION_KEY = 'testRunner.currentOperation.v1';
export const CURRENT_PROJECT_KEY = 'testRunner.currentProject.v1';

const OPERATIONS = [
  { id: 'sportia', label: 'Sportia', tagValues: ['Hub', 'Futebol', 'Menu'] },
  { id: 'roblox', label: 'Roblox', tagValues: [] },
  { id: 'fortnite', label: 'Fortnite', tagValues: [] },
  { id: 'gameloft', label: 'Gameloft', tagValues: [] },
];

let db = {};

export function currentOperationId() {
  try {
    const raw = window.localStorage.getItem(CURRENT_OPERATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && OPERATIONS.some((op) => op.id === parsed)) return parsed;
    }
  } catch {
    // localStorage indisponível: cai na operação padrão.
  }
  return OPERATIONS[0].id;
}

/** Nomes dos projetos (abas) da operação atual, na ordem de criação. */
function projectNames(opId = currentOperationId()) {
  return Object.keys(db[opId]?.projectsData ?? {});
}

export function currentProjectId() {
  const names = projectNames();
  try {
    const raw = window.localStorage.getItem(CURRENT_PROJECT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && names.includes(parsed)) return parsed;
    }
  } catch {
    // localStorage indisponível: cai no primeiro projeto da operação.
  }
  return names[0] ?? null;
}

/** Helpers para testes trocarem operação/projeto sem passar pela UI. */
export function setCurrentOperationForMock(id) {
  window.localStorage.setItem(CURRENT_OPERATION_KEY, JSON.stringify(id));
}
export function setCurrentProjectForMock(name) {
  window.localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(name));
}

function currentOp() {
  return db[currentOperationId()];
}

function currentProject() {
  return currentOp()?.projectsData[currentProjectId()] ?? null;
}

// --- Seeds -----------------------------------------------------------------

// Sportia: 1 projeto (o jogo). Usa a coluna Tag (Hub/Futebol/Menu) como
// localização do bug. project = 'Sportia' (a aba única).
function seedSportiaProjects() {
  return {
    Sportia: makeProject([
      { id: 'BUG-001', status: 'Open', severity: 'Critical', tag: 'Hub', title: 'Crash ao abrir o Hub em dispositivos Android', description: 'O app fecha sozinho ao abrir a tela do Hub.', attachment: '', foundBy: 'Carlos', version: '1.5.2', platform: 'Android', keywords: 'Bug', store: 'Playstore', createdIn: '2026-05-29' },
      { id: 'BUG-002', status: 'In progress', severity: 'Major', tag: 'Futebol', title: 'Placar não atualiza em tempo real', description: '', attachment: '', foundBy: 'Giovanni', version: '1.5.2', platform: 'Web', keywords: 'Bug', store: 'Steam', createdIn: '2026-06-02' },
      { id: 'BUG-003', status: 'To review', severity: 'Normal', tag: 'Menu', title: 'Texto cortado no menu de configurações', description: 'Em telas pequenas o texto do botão "Configurações" corta.', attachment: '', foundBy: 'Karen', version: '1.5.0', platform: 'IOS', keywords: 'Design', store: 'AppStore', createdIn: '2026-05-20' },
      { id: 'BUG-004', status: 'Done', severity: 'Low', tag: 'Hub', title: 'Ícone do Hub com cor errada', description: '', attachment: '', foundBy: 'Miguel', version: '1.4.0', platform: 'Pc', keywords: 'Design', store: 'Gameloft', createdIn: '2026-04-10' },
      { id: 'BUG-005', status: 'Closed', severity: 'Suggestion', tag: 'Menu', title: 'Sugestão de atalho de teclado no menu', description: '', attachment: '', foundBy: 'Vinicius', version: '1.4.0', platform: 'Pc', keywords: 'Incomplete', store: 'Digital Virgo', createdIn: '2026-03-15' },
      { id: 'BUG-006', status: "Won't fix", severity: 'Compliance', tag: 'Futebol', title: 'Nome de time third-party divergente da licença', description: '', attachment: '', foundBy: 'Carlos', version: '1.3.0', platform: 'Web', keywords: 'Legal', store: 'Bemobi', createdIn: '2026-02-01' },
      { id: 'BUG-007', status: 'Bloqueado', severity: 'Major', tag: 'Hub', title: 'Issue de exemplo com status fora do enum conhecido', description: 'Dado "sujo" propositalmente para validar a seção "não reconhecido" do Issue Tracker.', attachment: '', foundBy: 'Giovanni', version: '1.5.2', platform: 'Android', keywords: 'Bug', store: 'Plug in digital', createdIn: '2026-06-10' },
      { id: 'BUG-008', status: 'Open', severity: 'Normal', tag: 'Menu', title: 'Issue de exemplo com versão malformada', description: 'Dado "sujo" propositalmente para validar que a Home não quebra com versão fora do padrão 0.0.0.', attachment: '', foundBy: 'Karen', version: 'v-next', platform: 'Web', keywords: 'Bug', store: 'Steam', createdIn: '2026-06-15' },
    ]),
  };
}

// Roblox/Fortnite/Gameloft: multi-projeto (cada projeto = uma aba). Não usam a
// coluna Tag (localização vem do próprio projeto). Sequência BUG-### por aba.
function seedRobloxProjects() {
  return {
    'Mini-game X': makeProject([
      { id: 'BUG-001', status: 'Open', severity: 'Major', tag: '', title: 'Lobby do mini-game X não carrega skins', description: 'Avatares aparecem sem textura ao entrar no lobby.', attachment: '', foundBy: 'Carlos', version: '0.9.1', platform: 'Pc', keywords: 'Bug', store: 'Steam', createdIn: '2026-06-20' },
      { id: 'BUG-002', status: 'Open', severity: 'Critical', tag: '', title: 'Servidor derruba jogadores após 10 min no mini-game X', description: 'Desconexão em massa reproduzível.', attachment: '', foundBy: 'Giovanni', version: '0.9.1', platform: 'Pc', keywords: 'Bug', store: 'Steam', createdIn: '2026-06-22' },
    ]),
    'Mini-game Y': makeProject([
      { id: 'BUG-001', status: 'To review', severity: 'Normal', tag: '', title: 'Botão de compra sobreposto no mini-game Y', description: '', attachment: '', foundBy: 'Karen', version: '0.9.0', platform: 'Web', keywords: 'Design', store: 'Playstore', createdIn: '2026-06-18' },
    ]),
  };
}

function seedFortniteProjects() {
  return {
    'Battle Royale': makeProject([
      { id: 'BUG-001', status: 'Open', severity: 'Major', tag: '', title: 'Queda de FPS ao abrir o mapa', description: 'FPS despenca ao abrir o mapa completo.', attachment: '', foundBy: 'Miguel', version: '29.10', platform: 'Pc', keywords: 'Performance', store: 'Steam', createdIn: '2026-06-25' },
    ]),
    Creative: makeProject([
      { id: 'BUG-001', status: 'To review', severity: 'Normal', tag: '', title: 'Objetos somem ao publicar a ilha', description: '', attachment: '', foundBy: 'Vinicius', version: '29.10', platform: 'Pc', keywords: 'Bug', store: 'Steam', createdIn: '2026-06-24' },
    ]),
  };
}

function seedGameloftProjects() {
  return {
    Asphalt: makeProject([
      { id: 'BUG-001', status: 'Open', severity: 'Critical', tag: '', title: 'Carro atravessa a pista no circuito 3', description: 'Colisão falha em curva fechada.', attachment: '', foundBy: 'Carlos', version: '12.4.0', platform: 'Android', keywords: 'Collision', store: 'Playstore', createdIn: '2026-06-21' },
    ]),
    'Dragon Mania': makeProject([
      { id: 'BUG-001', status: 'Open', severity: 'Normal', tag: '', title: 'Ovo de dragão não choca após o tempo', description: '', attachment: '', foundBy: 'Karen', version: '8.2.1', platform: 'IOS', keywords: 'Bug', store: 'AppStore', createdIn: '2026-06-19' },
    ]),
  };
}

function seedSportiaTestRuns() {
  return [
    { id: 'RUN-001', build: 'build-214', version: '1.5.2', testType: 'Regressão', responsible: 'Karen', platform: 'Android', status: 'Pendente' },
    { id: 'RUN-002', build: 'build-213', version: '1.5.2', testType: 'Smoke', responsible: 'Miguel', platform: 'Web', status: 'Em andamento' },
    { id: 'RUN-003', build: 'build-210', version: '1.5.0', testType: 'Funcional', responsible: 'Vinicius', platform: 'IOS', status: 'Finalizado' },
  ];
}

function seedRobloxTestRuns() {
  return [
    { id: 'RUN-001', build: 'rbx-045', version: '0.9.1', testType: 'Smoke', responsible: 'Carlos', platform: 'Pc', status: 'Pendente' },
  ];
}

/** Monta o slice de um projeto: issues (com project carimbado) + contadores. */
function makeProject(issues) {
  return {
    issues,
    evidenceFiles: {},
    nextIssueSeq: issues.length + 1,
  };
}

function seedOperation(projectsData, testRuns) {
  // Carimba project = nome da aba em cada issue (o project é derivado da aba).
  for (const [name, project] of Object.entries(projectsData)) {
    project.issues = project.issues.map((issue) => ({ ...issue, project: name }));
  }
  return {
    projectsData,
    testRuns,
    nextTestRunSeq: testRuns.length + 1,
  };
}

export function resetStore() {
  db = {
    sportia: seedOperation(seedSportiaProjects(), seedSportiaTestRuns()),
    roblox: seedOperation(seedRobloxProjects(), seedRobloxTestRuns()),
    fortnite: seedOperation(seedFortniteProjects(), []),
    gameloft: seedOperation(seedGameloftProjects(), []),
  };
}

resetStore();

// --- Operações & projetos --------------------------------------------------

export function listOperationsInStore() {
  return OPERATIONS.map((op) => ({ ...op, tagValues: [...op.tagValues] }));
}

export function listProjectsInStore(opId = currentOperationId()) {
  return projectNames(opId);
}

export function addProjectInStore(name) {
  const op = currentOp();
  const trimmed = String(name ?? '').trim();
  if (trimmed && !op.projectsData[trimmed]) {
    op.projectsData[trimmed] = makeProject([]);
  }
  return projectNames();
}

// --- Issues (por projeto/aba) ----------------------------------------------

export function listIssues() {
  return currentProject()?.issues ?? [];
}

export function getIssueById(id) {
  return currentProject()?.issues.find((issue) => issue.id === id) ?? null;
}

export function addIssue(payload) {
  const pj = currentProject();
  const issue = {
    severity: '',
    tag: '',
    description: '',
    attachment: '',
    foundBy: '',
    platform: '',
    keywords: '',
    store: '',
    ...payload,
    id: `BUG-${String(pj.nextIssueSeq).padStart(3, '0')}`,
    status: 'Open',
    createdIn: new Date().toISOString().slice(0, 10),
    project: currentProjectId(), // project é derivado da aba selecionada
  };
  pj.nextIssueSeq += 1;
  pj.issues = [...pj.issues, issue];
  return issue;
}

/**
 * Simula falha de gravação para validar a reversão otimista (FR-010). Falha de
 * forma determinística para o id "BUG-002", já que testes/e2e precisam de um
 * caso previsível de conflito.
 */
export function updateIssueStatusInStore(id, status) {
  if (id === 'BUG-002') {
    const error = new Error('WRITE_CONFLICT');
    error.code = 'WRITE_CONFLICT';
    throw error;
  }
  const pj = currentProject();
  const issue = getIssueById(id);
  if (!issue) return null;
  const updated = { ...issue, status };
  pj.issues = pj.issues.map((existing) => (existing.id === id ? updated : existing));
  return updated;
}

/**
 * Edição de campos da issue (PATCH /issues/:id). Reusa o mesmo caso
 * determinístico de conflito de gravação ("BUG-002").
 */
export function updateIssueInStore(id, patch) {
  if (id === 'BUG-002') {
    const error = new Error('WRITE_CONFLICT');
    error.code = 'WRITE_CONFLICT';
    throw error;
  }
  const pj = currentProject();
  const issue = getIssueById(id);
  if (!issue) return null;
  const updated = { ...issue, ...patch };
  pj.issues = pj.issues.map((existing) => (existing.id === id ? updated : existing));
  return updated;
}

/**
 * Simula o anexo de evidências (POST /issues/:id/evidence): grava no attachment
 * o link fake da "pasta" da issue, como o backend real faz.
 */
export function attachEvidenceLinkInStore(id, file) {
  const pj = currentProject();
  const issue = getIssueById(id);
  if (!issue) return null;
  const updated = { ...issue, attachment: `https://drive.google.com/drive/folders/mock-${id}` };
  pj.issues = pj.issues.map((existing) => (existing.id === id ? updated : existing));
  if (file) {
    pj.evidenceFiles = { ...pj.evidenceFiles, [id]: [...(pj.evidenceFiles[id] ?? []), { name: file.name, type: file.type }] };
  }
  return updated;
}

export function listEvidenceFilesInStore(id) {
  return currentProject()?.evidenceFiles[id] ?? [];
}

// --- Test Runs (por operação) ----------------------------------------------

export function listTestRuns() {
  return currentOp().testRuns;
}

export function getTestRunById(id) {
  return currentOp().testRuns.find((run) => run.id === id) ?? null;
}

export function addTestRun(payload) {
  const op = currentOp();
  const demand = { id: `RUN-${String(op.nextTestRunSeq).padStart(3, '0')}`, status: 'Pendente', ...payload };
  op.nextTestRunSeq += 1;
  op.testRuns = [...op.testRuns, demand];
  return demand;
}

/**
 * Simula falha de gravação do drag-and-drop do Test Run (spec 002), no mesmo
 * padrão de updateIssueStatusInStore, para o id "RUN-002".
 */
export function updateTestRunStatusInStore(id, status) {
  if (id === 'RUN-002') {
    const error = new Error('WRITE_CONFLICT');
    error.code = 'WRITE_CONFLICT';
    throw error;
  }
  const op = currentOp();
  const demand = getTestRunById(id);
  if (!demand) return null;
  const updated = { ...demand, status };
  op.testRuns = op.testRuns.map((existing) => (existing.id === id ? updated : existing));
  return updated;
}
