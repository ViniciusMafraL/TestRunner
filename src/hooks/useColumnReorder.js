import { useEffect, useRef, useState } from 'react';
import { computeDropAnchor } from '../utils/columnLayout.js';

const HOLD_MS = 200;
const SLOP_PX = 5;

/**
 * Reordenação de colunas por segurar-e-arrastar: pressionar um cabeçalho por
 * ~200ms ativa o modo de mover (soltar ou mover além do slop antes disso é um
 * clique/rolagem normal); arrastar na horizontal escolhe a âncora de drop e
 * soltar move a coluna para antes dela (null = fim). Escape cancela.
 *
 * O estado é por campo (não por índice): o destaque e o indicador aparecem em
 * todas as tabelas de grupo ao mesmo tempo. A geometria lê os `th[data-field]`
 * da linha de cabeçalho onde o arrasto começou — as tabelas são alinhadas por
 * construção (mesmas vars de largura no container).
 *
 * Limitação conhecida (deferida): não há auto-scroll do .table-scroll-wrapper
 * quando o ponteiro chega perto da borda durante o arrasto — o usuário rola a
 * tabela antes de arrastar.
 */
export function useColumnReorder({ onMove }) {
  const [dragField, setDragField] = useState(null);
  // null = sem alvo; { anchor: campo | null } = soltar antes do campo (null = fim).
  const [dropTarget, setDropTarget] = useState(null);
  const sessionRef = useRef(null);

  function cleanupSession({ commit } = { commit: false }) {
    const session = sessionRef.current;
    if (!session) return;
    clearTimeout(session.timer);
    document.removeEventListener('pointermove', session.onPointerMove);
    document.removeEventListener('pointerup', session.onPointerUp);
    document.removeEventListener('keydown', session.onKeyDown);
    sessionRef.current = null;
    if (commit && session.active && session.anchor !== undefined) {
      onMove(session.field, session.anchor);
    }
    setDragField(null);
    setDropTarget(null);
  }

  useEffect(() => {
    return () => cleanupSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getHeaderProps(field) {
    return {
      onPointerDown(event) {
        if (event.button !== 0 || sessionRef.current) return;
        const th = event.currentTarget;
        const session = {
          field,
          th,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          active: false,
          anchor: undefined,
          onPointerMove(moveEvent) {
            const current = sessionRef.current;
            if (!current) return;
            if (!current.active) {
              // Antes do hold completar, movimento além do slop = clique/rolagem, não arrasto.
              if (
                Math.abs(moveEvent.clientX - current.startX) > SLOP_PX ||
                Math.abs(moveEvent.clientY - current.startY) > SLOP_PX
              ) {
                cleanupSession();
              }
              return;
            }
            if (!current.th.isConnected) {
              cleanupSession();
              return;
            }
            const headerRow = current.th.closest('tr');
            const cells = headerRow ? [...headerRow.querySelectorAll('th[data-field]')] : [];
            const rects = cells.map((cell) => {
              const rect = cell.getBoundingClientRect();
              return { field: cell.dataset.field, left: rect.left, width: rect.width };
            });
            const anchor = computeDropAnchor(rects, moveEvent.clientX);
            if (anchor !== current.anchor) {
              current.anchor = anchor;
              setDropTarget({ anchor });
            }
          },
          onPointerUp() {
            cleanupSession({ commit: true });
          },
          onKeyDown(keyEvent) {
            if (keyEvent.key === 'Escape') cleanupSession();
          },
          timer: setTimeout(() => {
            const current = sessionRef.current;
            if (!current) return;
            current.active = true;
            try {
              current.th.setPointerCapture?.(current.pointerId);
            } catch {
              // jsdom/browsers antigos sem pointer capture: o arrasto segue via listeners no document.
            }
            setDragField(current.field);
          }, HOLD_MS),
        };
        sessionRef.current = session;
        document.addEventListener('pointermove', session.onPointerMove);
        document.addEventListener('pointerup', session.onPointerUp);
        document.addEventListener('keydown', session.onKeyDown);
      },
    };
  }

  return { dragField, dropTarget, getHeaderProps };
}
