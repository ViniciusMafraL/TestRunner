let issues = [];
let testRuns = [];
let nextIssueSeq = 1;
let nextTestRunSeq = 1;

function seedIssues() {
  return [
    {
      id: 'BUG-001',
      status: 'Open',
      severity: 'Critical',
      tag: 'Hub',
      title: 'Crash ao abrir o Hub em dispositivos Android',
      description: 'O app fecha sozinho ao abrir a tela do Hub.',
      attachment: '',
      foundBy: 'Carlos',
      version: '1.5.2',
      platform: 'Android',
      keywords: 'Bug',
      store: 'Playstore',
      createdIn: '2026-05-29',
    },
    {
      id: 'BUG-002',
      status: 'In progress',
      severity: 'Major',
      tag: 'Futebol',
      title: 'Placar não atualiza em tempo real',
      description: '',
      attachment: '',
      foundBy: 'Giovanni',
      version: '1.5.2',
      platform: 'Web',
      keywords: 'Bug',
      store: 'Steam',
      createdIn: '2026-06-02',
    },
    {
      id: 'BUG-003',
      status: 'To review',
      severity: 'Normal',
      tag: 'Menu',
      title: 'Texto cortado no menu de configurações',
      description: 'Em telas pequenas o texto do botão "Configurações" corta.',
      attachment: '',
      foundBy: 'Karen',
      version: '1.5.0',
      platform: 'IOS',
      keywords: 'Design',
      store: 'AppStore',
      createdIn: '2026-05-20',
    },
    {
      id: 'BUG-004',
      status: 'Done',
      severity: 'Low',
      tag: 'Hub',
      title: 'Ícone do Hub com cor errada',
      description: '',
      attachment: '',
      foundBy: 'Miguel',
      version: '1.4.0',
      platform: 'Pc',
      keywords: 'Design',
      store: 'Gameloft',
      createdIn: '2026-04-10',
    },
    {
      id: 'BUG-005',
      status: 'Closed',
      severity: 'Suggestion',
      tag: 'Menu',
      title: 'Sugestão de atalho de teclado no menu',
      description: '',
      attachment: '',
      foundBy: 'Vinicius',
      version: '1.4.0',
      platform: 'Pc',
      keywords: 'Incomplete',
      store: 'Digital Virgo',
      createdIn: '2026-03-15',
    },
    {
      id: 'BUG-006',
      status: "Won't fix",
      severity: 'Compliance',
      tag: 'Futebol',
      title: 'Nome de time third-party divergente da licença',
      description: '',
      attachment: '',
      foundBy: 'Carlos',
      version: '1.3.0',
      platform: 'Web',
      keywords: 'Legal',
      store: 'Bemobi',
      createdIn: '2026-02-01',
    },
    {
      id: 'BUG-007',
      status: 'Bloqueado',
      severity: 'Major',
      tag: 'Hub',
      title: 'Issue de exemplo com status fora do enum conhecido',
      description: 'Dado "sujo" propositalmente para validar a seção "não reconhecido" do Issue Tracker.',
      attachment: '',
      foundBy: 'Giovanni',
      version: '1.5.2',
      platform: 'Android',
      keywords: 'Bug',
      store: 'Plug in digital',
      createdIn: '2026-06-10',
    },
    {
      id: 'BUG-008',
      status: 'Open',
      severity: 'Normal',
      tag: 'Menu',
      title: 'Issue de exemplo com versão malformada',
      description: 'Dado "sujo" propositalmente para validar que a Home não quebra com versão fora do padrão 0.0.0.',
      attachment: '',
      foundBy: 'Karen',
      version: 'v-next',
      platform: 'Web',
      keywords: 'Bug',
      store: 'Steam',
      createdIn: '2026-06-15',
    },
  ];
}

function seedTestRuns() {
  return [
    {
      id: 'RUN-001',
      build: 'build-214',
      version: '1.5.2',
      testType: 'Regressão',
      responsible: 'Karen',
      platform: 'Android',
      status: 'Pendente',
    },
    {
      id: 'RUN-002',
      build: 'build-213',
      version: '1.5.2',
      testType: 'Smoke',
      responsible: 'Miguel',
      platform: 'Web',
      status: 'Em andamento',
    },
    {
      id: 'RUN-003',
      build: 'build-210',
      version: '1.5.0',
      testType: 'Funcional',
      responsible: 'Vinicius',
      platform: 'IOS',
      status: 'Finalizado',
    },
  ];
}

export function resetStore() {
  issues = seedIssues();
  testRuns = seedTestRuns();
  nextIssueSeq = issues.length + 1;
  nextTestRunSeq = testRuns.length + 1;
}

resetStore();

export function listIssues() {
  return issues;
}

export function getIssueById(id) {
  return issues.find((issue) => issue.id === id) ?? null;
}

export function addIssue(payload) {
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
    id: `BUG-${String(nextIssueSeq).padStart(3, '0')}`,
    status: 'Open',
    createdIn: new Date().toISOString().slice(0, 10),
  };
  nextIssueSeq += 1;
  issues = [...issues, issue];
  return issue;
}

/**
 * Simula falha de gravação para permitir validar a reversão otimista (FR-010).
 * Falha de forma determinística para o id "BUG-002", já que testes/e2e precisam
 * de um caso previsível de conflito.
 */
export function updateIssueStatusInStore(id, status) {
  if (id === 'BUG-002') {
    const error = new Error('WRITE_CONFLICT');
    error.code = 'WRITE_CONFLICT';
    throw error;
  }
  const issue = getIssueById(id);
  if (!issue) return null;
  const updated = { ...issue, status };
  issues = issues.map((existing) => (existing.id === id ? updated : existing));
  return updated;
}

export function listTestRuns() {
  return testRuns;
}

export function getTestRunById(id) {
  return testRuns.find((run) => run.id === id) ?? null;
}

export function addTestRun(payload) {
  const demand = {
    id: `RUN-${String(nextTestRunSeq).padStart(3, '0')}`,
    status: 'Pendente',
    ...payload,
  };
  nextTestRunSeq += 1;
  testRuns = [...testRuns, demand];
  return demand;
}

/**
 * Simula falha de gravação para permitir validar a reversão otimista do
 * drag-and-drop do Test Run (spec 002, Edge Cases), no mesmo padrão usado por
 * updateIssueStatusInStore para "BUG-002".
 */
export function updateTestRunStatusInStore(id, status) {
  if (id === 'RUN-002') {
    const error = new Error('WRITE_CONFLICT');
    error.code = 'WRITE_CONFLICT';
    throw error;
  }
  const demand = getTestRunById(id);
  if (!demand) return null;
  const updated = { ...demand, status };
  testRuns = testRuns.map((existing) => (existing.id === id ? updated : existing));
  return updated;
}
