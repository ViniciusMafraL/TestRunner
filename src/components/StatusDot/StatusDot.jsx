export function StatusDot({ status, category }) {
  return (
    <span className="status-label">
      <span className={`status-dot status-dot--${category}`} />
      {status}
    </span>
  );
}
