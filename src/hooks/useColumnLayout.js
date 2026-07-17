import { useLocalStorageState } from './useLocalStorageState.js';
import { clampWidth, mergeStoredOrder, moveFieldBefore } from '../utils/columnLayout.js';

const INITIAL_LAYOUT = { order: null, widths: {} };

/**
 * Ordem e larguras das colunas, persistidas no navegador (uma chave só, para
 * o reset ser atômico). `order: null` até o primeiro reorder — quem nunca
 * mexeu continua acompanhando mudanças futuras da ordem padrão do código.
 * `widths` é esparso (só campos alterados); campos novos ganham o default do
 * código sem migração, e `mergeStoredOrder` concilia campos adicionados ou
 * removidos entre versões.
 */
export function useColumnLayout(storageKey, canonicalOrder, defaultWidths, flexFields) {
  const [stored, setStored] = useLocalStorageState(storageKey, INITIAL_LAYOUT);
  const layout = stored && typeof stored === 'object' ? stored : INITIAL_LAYOUT;
  const widths = layout.widths && typeof layout.widths === 'object' ? layout.widths : {};

  const order = mergeStoredOrder(layout.order, canonicalOrder);

  function effectiveWidth(field) {
    if (typeof widths[field] === 'number') return widths[field];
    return flexFields.includes(field) ? undefined : defaultWidths[field];
  }

  function minWidthContribution(field) {
    return widths[field] ?? defaultWidths[field] ?? 120;
  }

  function setColumnWidth(field, px) {
    setStored((previous) => {
      const base = previous && typeof previous === 'object' ? previous : INITIAL_LAYOUT;
      return { ...base, widths: { ...base.widths, [field]: clampWidth(px) } };
    });
  }

  function moveColumn(field, anchorField) {
    setStored((previous) => {
      const base = previous && typeof previous === 'object' ? previous : INITIAL_LAYOUT;
      const currentOrder = mergeStoredOrder(base.order, canonicalOrder);
      return { ...base, order: moveFieldBefore(currentOrder, field, anchorField) };
    });
  }

  function resetLayout() {
    setStored(INITIAL_LAYOUT);
  }

  return { order, widths, effectiveWidth, minWidthContribution, setColumnWidth, moveColumn, resetLayout };
}
