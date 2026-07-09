function colorFor(name) {
  if (!name) return 'var(--color-gray-400)';
  const hash = [...name].reduce((total, char) => total * 31 + char.charCodeAt(0), 7);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 42%)`;
}

function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name }) {
  return (
    <span className="avatar" style={{ background: colorFor(name) }} aria-hidden="true">
      {initialsFor(name)}
    </span>
  );
}

export function AvatarWithLabel({ name }) {
  if (!name) return <span>—</span>;
  return (
    <span className="avatar-with-label">
      <Avatar name={name} />
      {name}
    </span>
  );
}

const MAX_STACK_AVATARS = 3;

/**
 * Found By múltiplo: pilha de avatares sobrepostos (estilo ClickUp) em vez de
 * nome por extenso — passar o mouse ou focar (Tab) revela o nome num tooltip.
 * Além de MAX_STACK_AVATARS, os excedentes viram um badge "+N" com o resto
 * dos nomes no próprio tooltip.
 */
export function AvatarGroup({ names }) {
  const list = String(names ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (list.length === 0) return <span className="field-value--empty">—</span>;

  const visible = list.slice(0, MAX_STACK_AVATARS);
  const overflow = list.slice(MAX_STACK_AVATARS);

  return (
    <span className="avatar-stack">
      {visible.map((name) => (
        <span key={name} className="avatar-stack-item" tabIndex={0}>
          <Avatar name={name} />
          <span className="avatar-tooltip" role="tooltip">
            {name}
          </span>
        </span>
      ))}
      {overflow.length > 0 ? (
        <span className="avatar-stack-item" tabIndex={0}>
          <span className="avatar avatar--overflow" aria-hidden="true">
            +{overflow.length}
          </span>
          <span className="avatar-tooltip" role="tooltip">
            {overflow.join(', ')}
          </span>
        </span>
      ) : null}
    </span>
  );
}
