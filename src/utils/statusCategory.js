import { StatusGroup } from 'shared/enums.js';

export function issueStatusCategory(status) {
  return StatusGroup[status] ?? 'desconhecido';
}

const TEST_RUN_CATEGORY = {
  Pendente: 'run-pendente',
  'Em andamento': 'run-andamento',
  Finalizado: 'run-finalizado',
};

export function testRunStatusCategory(status) {
  return TEST_RUN_CATEGORY[status] ?? 'desconhecido';
}
