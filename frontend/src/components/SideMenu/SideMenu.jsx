import { NavLink } from 'react-router-dom';
import { useSession } from '../../auth/SessionContext.jsx';
import { Avatar } from '../Avatar/Avatar.jsx';

const SECTIONS = [
  { to: '/home', label: 'Home', icon: '⌂' },
  { to: '/test-run', label: 'Test Run', icon: '◆' },
  { to: '/issue-tracker', label: 'Issue Tracker', icon: '▥' },
  { to: '/test-plan', label: 'Test Plan', icon: '☰' },
  { to: '/reporter', label: 'Report', icon: '✎' },
];

export function SideMenu() {
  const { session, canWrite, logout } = useSession();

  return (
    <nav className="app-sidebar" aria-label="Navegação principal">
      <div className="app-logo">
        <span className="app-logo-mark" aria-hidden="true">
          ✦
        </span>
        Qa TestRunner
      </div>

      <input className="app-search" type="search" placeholder="Buscar" aria-label="Buscar" />

      <ul className="app-nav-list">
        {SECTIONS.map((section) => (
          <li key={section.to}>
            <NavLink to={section.to} className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
              <span className="app-nav-icon" aria-hidden="true">
                {section.icon}
              </span>
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="card" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span className="avatar-with-label">
          <Avatar name={session?.displayName} />
          <span>
            <div style={{ font: 'var(--font-label)' }}>{session?.displayName}</div>
            <div style={{ font: 'var(--font-caption)', color: 'var(--color-gray-600)' }}>
              {canWrite ? 'Acesso completo' : 'Somente leitura'}
            </div>
          </span>
        </span>
        <button type="button" className="button-secondary" onClick={logout}>
          Sair
        </button>
      </div>
    </nav>
  );
}
