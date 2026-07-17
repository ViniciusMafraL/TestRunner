import { useRef } from 'react';
import { clampWidth } from '../../utils/columnLayout.js';

/**
 * Cabeçalho de coluna do Issue Tracker: rótulo + alça de redimensionar na
 * borda direita, e alvo do segurar-e-arrastar de reordenação (reorderProps).
 *
 * A largura vem de `var(--col-<campo>)` definida no container dos grupos —
 * assim todas as tabelas de grupo compartilham a mesma largura. Durante o
 * arrasto de resize a var é escrita direto no DOM (zero re-render por
 * pointermove); o valor final é commitado via onResizeCommit no pointerup.
 *
 * A alça é um span aria-hidden (não um botão) de propósito: o nome acessível
 * do columnheader continua sendo apenas o rótulo, como os testes esperam.
 */
export function ColumnHeaderCell({
  field,
  label,
  isDragging,
  dropSide,
  reorderProps,
  containerRef,
  fallbackWidth,
  onResizeCommit,
}) {
  const thRef = useRef(null);

  function startResize(event) {
    if (event.button !== 0) return;
    // Impede que o pointerdown chegue ao th e dispare o hold de reordenação.
    event.stopPropagation();
    event.preventDefault();
    const handle = event.currentTarget;
    const container = containerRef.current;
    const startX = event.clientX;
    // Fallback para ambientes sem layout real (jsdom devolve rect zerado).
    const startWidth = thRef.current.getBoundingClientRect().width || fallbackWidth || 120;
    const previousVar = container ? container.style.getPropertyValue(`--col-${field}`) : '';
    let finalWidth = startWidth;
    let moved = false;

    try {
      handle.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom sem pointer capture: o resize segue via listeners no document.
    }

    function onPointerMove(moveEvent) {
      moved = true;
      finalWidth = clampWidth(startWidth + (moveEvent.clientX - startX));
      container?.style.setProperty(`--col-${field}`, `${finalWidth}px`);
    }

    function restorePreviousVar() {
      if (!container) return;
      if (previousVar) container.style.setProperty(`--col-${field}`, previousVar);
      else container.style.removeProperty(`--col-${field}`);
    }

    function cleanup() {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onPointerUp() {
      cleanup();
      // Sem movimento não há commit — clicar na alça não pode fixar a largura
      // de uma coluna flex (title/description) sem intenção.
      if (moved) onResizeCommit(field, finalWidth);
    }

    function onKeyDown(keyEvent) {
      if (keyEvent.key === 'Escape') {
        cleanup();
        restorePreviousVar();
      }
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('keydown', onKeyDown);
  }

  const classNames = [
    isDragging ? 'th--dragging' : '',
    dropSide === 'before' ? 'th--drop-before' : '',
    dropSide === 'after' ? 'th--drop-after' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <th
      ref={thRef}
      data-field={field}
      className={classNames || undefined}
      style={{ width: `var(--col-${field}, auto)` }}
      {...reorderProps}
    >
      {label}
      <span className="col-resize-handle" aria-hidden="true" onPointerDown={startResize} />
    </th>
  );
}
