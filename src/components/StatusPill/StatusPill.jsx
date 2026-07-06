import { issueStatusSlug } from '../../utils/statusCategory.js';
import { Dropdown } from '../Dropdown/Dropdown.jsx';

/* Ponto colorido do status, para uso dentro de pílulas e opções de dropdown. */
function Dot({ status }) {
  return <span className={`status-dot status-dot--${issueStatusSlug(status)}`} style={{ marginRight: 0 }} aria-hidden="true" />;
}

/** Pílula de status somente leitura: fundo tingido + ponto colorido + rótulo. */
export function StatusPill({ status }) {
  return (
    <span className={`status-pill status-pill--${issueStatusSlug(status)}`}>
      <span className="status-pill-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

/** Pílula de status editável: gatilho com o mesmo visual, abrindo o Dropdown
    do design system (opções com ponto colorido por status). */
export function StatusPillSelect({ value, options, onChange, ariaLabel }) {
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <Dropdown
      value={value}
      options={list}
      onChange={onChange}
      ariaLabel={ariaLabel}
      triggerClassName={`status-pill status-pill--${issueStatusSlug(value)}`}
      renderValue={(status) => (
        <>
          <span className="status-pill-dot" aria-hidden="true" />
          {status}
        </>
      )}
      renderOption={(status) => (
        <>
          <Dot status={status} />
          {status}
        </>
      )}
    />
  );
}
