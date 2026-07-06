import { useEffect, useId, useRef, useState } from 'react';

function defaultLabel(option) {
  return option === '' ? '—' : String(option);
}

/**
 * Dropdown próprio do design system — substitui o <select> nativo para que o
 * popup siga os tokens (inclusive no modo escuro). Padrão ARIA de combobox
 * somente-seleção: botão gatilho + listbox; setas/Enter/Escape no teclado.
 *
 * A lista usa position:fixed calculada na abertura para não ser cortada por
 * containers com overflow (tabelas com rolagem, modais); rolagem/resize fora
 * dela fecham o popup para não desalinhar.
 */
export function Dropdown({ id, ariaLabel, value, options, onChange, renderOption, renderValue, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();

  const optionContent = renderOption ?? defaultLabel;
  const valueContent = renderValue ?? defaultLabel;

  function openMenu() {
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 140) });
    const currentIndex = options.indexOf(value);
    setHighlighted(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  function select(option) {
    closeMenu();
    if (option !== value) onChange(option);
  }

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) closeMenu();
    }
    function handleScroll(event) {
      if (rootRef.current && rootRef.current.contains(event.target)) return;
      closeMenu();
    }
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setHighlighted((index) => Math.min(options.length - 1, Math.max(0, index + delta)));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) {
        select(options[highlighted]);
      } else {
        openMenu();
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  }

  return (
    <span className="dropdown" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={triggerClassName ?? 'dropdown-trigger'}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${highlighted}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="dropdown-value">{valueContent(value)}</span>
        <svg
          className="dropdown-caret"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open ? (
        <ul className="dropdown-menu" role="listbox" id={listId} style={menuStyle}>
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option === value}
              className={`dropdown-option${option === value ? ' dropdown-option--selected' : ''}${
                index === highlighted ? ' dropdown-option--highlighted' : ''
              }`}
              onMouseEnter={() => setHighlighted(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option)}
            >
              {optionContent(option)}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}
