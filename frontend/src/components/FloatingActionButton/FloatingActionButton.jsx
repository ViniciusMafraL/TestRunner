import { Link } from 'react-router-dom';

export function FloatingActionButton({ to, label }) {
  return (
    <Link to={to} className="fab">
      {label}
    </Link>
  );
}
