import { useEffect, useId, useRef, useState } from 'react';
import { computePopupStyle } from './Dropdown.jsx';

function splitValues(value) {
  return String(value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Variante multi-seleção do Dropdown do design system (Found By múltiplo).
 * Trabalha sobre o mesmo formato da planilha: `value` é a string
 * "Nome A, Nome B" e onChange devolve a string atualizada — assim os
 * formulários continuam comparando/enviando strings como nos demais campos.
 */
export function MultiSelectDropdown({ id, ariaLabel, value, options, onChange, placeholder = '—' }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();

  const selected = splitValues(value);

  function openMenu() {
    setMenuStyle(computePopupStyle(triggerRef.current.getBoundingClientRect()));
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  function toggleOption(option) {
    const next = selected.includes(option) ? selected.filter((entry) => entry !== option) : [...selected, option];
    onChange(next.join(', '));
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
    if (event.key === 'Escape' && open) {
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
        className="dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="dropdown-value">{selected.length > 0 ? selected.join(', ') : placeholder}</span>
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
        <ul className="dropdown-menu" role="listbox" aria-multiselectable="true" id={listId} style={menuStyle}>
          {options.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={selected.includes(option)}
              className={`dropdown-option${selected.includes(option) ? ' dropdown-option--selected' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => toggleOption(option)}
            >
              <input type="checkbox" checked={selected.includes(option)} readOnly tabIndex={-1} aria-hidden="true" />
              {option}
            </li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}
