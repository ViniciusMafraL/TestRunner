import { Link } from 'react-router-dom';

export function FloatingActionButton({ to, label }) {
  return (
    <Link to={to} className="fab">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5" />
        <path d="m9 13 2 2 4-4" />
      </svg>
      {label}
    </Link>
  );
}
