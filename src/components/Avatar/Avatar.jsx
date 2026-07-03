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
    <span className="avatar" style={{ background: colorFor(name) }} title={name} aria-hidden="true">
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
