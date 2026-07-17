/**
 * Layout das colunas do Issue Tracker (largura + ordem), separado da página
 * para que hook, componentes e testes unitários compartilhem a mesma lógica.
 */

export const DEFAULT_COLUMN_WIDTHS = {
  checkbox: 24,
  id: 90,
  status: 120,
  project: 130,
  severity: 110,
  tag: 90,
  title: 220,
  description: 220,
  attachment: 160,
  foundBy: 150,
  version: 90,
  platform: 100,
  keywords: 120,
  store: 150,
  createdIn: 110,
};

/**
 * Colunas sem largura fixa: no table-layout fixed, elas absorvem toda a sobra
 * de espaço da tabela, mantendo as demais colunas justas. Ao serem
 * redimensionadas pelo usuário ganham largura fixa; o reset devolve o flex.
 */
export const FLEX_COLUMNS = ['title', 'description'];

export const MIN_COLUMN_WIDTH = 60;
export const MAX_COLUMN_WIDTH = 800;

export function clampWidth(px) {
  return Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, px)));
}

/**
 * Concilia a ordem salva com a ordem canônica do código (evolução de schema):
 * mantém a sequência salva só com campos que ainda existem e anexa ao final,
 * na ordem canônica, os campos novos que a versão salva não conhecia.
 */
export function mergeStoredOrder(storedOrder, canonicalOrder) {
  if (!Array.isArray(storedOrder)) return canonicalOrder;
  const kept = storedOrder.filter((field) => canonicalOrder.includes(field));
  const missing = canonicalOrder.filter((field) => !kept.includes(field));
  return [...kept, ...missing];
}

/**
 * Move `field` para imediatamente antes de `anchorField` (ou para o fim,
 * quando a âncora é null). Opera na ordem COMPLETA — usar uma âncora visível
 * faz as colunas ocultas manterem posição relativa sã.
 */
export function moveFieldBefore(order, field, anchorField) {
  if (field === anchorField || !order.includes(field)) return order;
  const without = order.filter((item) => item !== field);
  if (anchorField === null || !without.includes(anchorField)) {
    return [...without, field];
  }
  const anchorIndex = without.indexOf(anchorField);
  return [...without.slice(0, anchorIndex), field, ...without.slice(anchorIndex)];
}

/**
 * Âncora de drop a partir da posição X do ponteiro sobre os cabeçalhos:
 * o primeiro campo cujo ponto médio está à direita do ponteiro (soltar =
 * inserir antes dele); null = depois do último.
 */
export function computeDropAnchor(cellRects, pointerX) {
  for (const rect of cellRects) {
    if (pointerX < rect.left + rect.width / 2) return rect.field;
  }
  return null;
}
