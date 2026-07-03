export function Loading({ variant = 'block', label = 'Carregando' }) {
  const dots = (
    <span className="loading-dots" role="status" aria-label={label}>
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </span>
  );

  if (variant === 'overlay') {
    return <div className="loading-overlay">{dots}</div>;
  }

  return <div className="loading-block">{dots}</div>;
}
