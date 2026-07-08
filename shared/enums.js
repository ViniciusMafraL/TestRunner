export const Status = ['Open', 'To review', 'In progress', 'By Design', 'Fixed', 'Done', 'Closed', "Won't fix"];

export const Severity = ['Critical', 'Compliance', 'Major', 'Normal', 'Low', 'Suggestion'];

export const Tag = ['Hub', 'Futebol', 'Menu'];

export const FoundBy = ['Carlos', 'Giovanni', 'Miguel', 'Karen', 'Vinicius'];

export const Platform = ['Pc', 'Android', 'Web', 'IOS'];

// Mesma lista e ordem do seletor "Key words" da planilha (multi-seleção lá e cá).
export const Keywords = [
  'Bug',
  'Collision',
  'Design',
  'Feature',
  'Game Design',
  'Incomplete',
  'Level Design',
  'Sound',
  'Suggestion',
  'Text',
  'Texture',
  'UI',
  'UX',
  'Visuals',
  'Crash',
  'Legal',
  'Performance',
  'IA',
];

export const Store = ['Steam', 'Playstore', 'AppStore', 'Gameloft', 'Digital Virgo', 'Bemobi', 'Plug in digital'];

export const UNMAPPED_STATUS = 'Não mapeado';

export const StatusGroup = {
  Open: 'aberta',
  'To review': 'aberta',
  'In progress': 'aberta',
  'By Design': 'aberta',
  Fixed: 'concluida',
  Done: 'concluida',
  Closed: 'fechada',
  "Won't fix": 'fechada',
};

export const TestRunStatus = ['Pendente', 'Em andamento', 'Finalizado'];

export const TestType = ['Regressão', 'Funcional', 'Smoke', 'Performance', 'Compatibilidade', 'Exploratório'];
