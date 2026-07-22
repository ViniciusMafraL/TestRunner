import { StatusGroup } from 'shared/enums.js';

export function issueStatusCategory(status) {
  return StatusGroup[status] ?? 'desconhecido';
}

/* Slug visual por status individual — cores de pill/dot do redesign do Issue Tracker. */
const ISSUE_STATUS_SLUG = {
  Open: 'open',
  Reopen: 'reopen',
  'To review': 'review',
  'In progress': 'progress',
  'Fixed For Next Build': 'nextbuild',
  'By Design': 'bydesign',
  Fixed: 'validated',
  Closed: 'closed',
  "Won't fix": 'wontfix',
};

export function issueStatusSlug(status) {
  return ISSUE_STATUS_SLUG[status] ?? 'desconhecido';
}

const TEST_RUN_CATEGORY = {
  Pendente: 'run-pendente',
  'Em andamento': 'run-andamento',
  Finalizado: 'run-finalizado',
};

export function testRunStatusCategory(status) {
  return TEST_RUN_CATEGORY[status] ?? 'desconhecido';
}
