/**
 * Link do "Quadro da operação" (planilha de report do Google Sheets) por
 * operação. Cada operação abre a sua própria planilha, na aba do Issue Tracker.
 *
 * Hoje é um mapa fixo aqui no frontend. A aba Operations da planilha de controle
 * já guarda o `spreadsheetId` de cada operação (backend/src/repositories/
 * operationsRepository.js) — se um dia quisermos que operações novas ganhem o
 * botão sem mexer no código, dá para devolver este link direto de getOperations
 * (uma coluna "BoardUrl" na aba). Por ora, os links foram informados manualmente.
 */
const OPERATION_BOARD_URLS = {
  sportia: 'https://docs.google.com/spreadsheets/d/1WeBparMLMvHd6Wqyyhe4LCltZR9L7k3n31PJs53c_Ps/edit?gid=363802640#gid=363802640',
  devops: 'https://docs.google.com/spreadsheets/d/1f1OXB6uQV_WP2o1oQ-j_Cm1tYxnZhlP0qabdFsjpthU/edit?gid=743833821#gid=743833821',
  fortnite: 'https://docs.google.com/spreadsheets/d/1SpkWKKMPn8hDcsUjsAzjWHlXIV9f6UkNse1oR9ht7tE/edit?gid=1419521621#gid=1419521621',
  roblox: 'https://docs.google.com/spreadsheets/d/1zni_Zwj83vaMte7xXt49IvDXy96FiL3XS9E30L3Aiyc/edit?gid=743833821#gid=743833821',
};

/** URL do quadro da operação (case-insensitive no id), ou null se não houver. */
export function boardUrlForOperation(operationId) {
  if (!operationId) return null;
  return OPERATION_BOARD_URLS[String(operationId).toLowerCase()] ?? null;
}
