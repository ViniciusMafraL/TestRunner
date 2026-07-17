import { NavLink } from 'react-router-dom';
import { useSession } from '../../auth/SessionContext.jsx';
import { useOperations } from '../../operations/OperationContext.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { APP_VERSION, BUILD_TIME } from '../../version.js';
import { Avatar } from '../Avatar/Avatar.jsx';
import { Dropdown } from '../Dropdown/Dropdown.jsx';
import { PublishUpdateButton } from '../PublishUpdateButton/PublishUpdateButton.jsx';

function OperationSwitcher() {
  const { operations, currentOperation, selectOperation } = useOperations();
  if (operations.length === 0) return null;
  const labelOf = (id) => operations.find((op) => op.id === id)?.label ?? id;
  return (
    <div className="app-operation-switcher">
      <span className="app-operation-label">Operação</span>
      <Dropdown
        ariaLabel="Operação"
        value={currentOperation ?? operations[0].id}
        options={operations.map((op) => op.id)}
        onChange={selectOperation}
        renderValue={labelOf}
        renderOption={labelOf}
      />
    </div>
  );
}

function ProjectSwitcher() {
  const { projects, currentProject, selectProject } = useOperations();
  // Oculto quando a operação tem 0 ou 1 projeto (ex.: Sportia) — nesse caso não
  // há troca a fazer e a localização vem da Tag.
  if (projects.length <= 1) return null;
  return (
    <div className="app-operation-switcher">
      <span className="app-operation-label">Projeto</span>
      <Dropdown
        ariaLabel="Projeto"
        value={currentProject ?? projects[0]}
        options={projects}
        onChange={selectProject}
      />
    </div>
  );
}

function Icon({ children, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const HomeIcon = (
  <Icon>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </Icon>
);

const TestRunIcon = (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <polygon points="10 8.5 16 12 10 15.5" />
  </Icon>
);

const BugIcon = (
  <Icon>
    <rect x="8" y="8" width="8" height="12" rx="4" />
    <path d="M9 8a3 3 0 0 1 6 0" />
    <path d="M8 12H4m16 0h-4M8 16H5m14 0h-3" />
    <path d="M9 5 7.5 3.5M15 5l1.5-1.5" />
  </Icon>
);

const TestPlanIcon = (
  <Icon>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5" />
    <path d="M9 10h6M9 14h6M9 18h4" />
  </Icon>
);

const ReportIcon = (
  <Icon>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </Icon>
);

const LogoutIcon = (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

const MoonIcon = (
  <Icon>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
  </Icon>
);

const SunIcon = (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
  </Icon>
);

const SECTIONS = [
  { to: '/home', label: 'Home', icon: HomeIcon },
  { to: '/test-run', label: 'Test Run', icon: TestRunIcon },
  { to: '/issue-tracker', label: 'Issue Tracker', icon: BugIcon },
  { to: '/test-plan', label: 'Test Plan', icon: TestPlanIcon },
  { to: '/reporter', label: 'Report', icon: ReportIcon },
];

export function SideMenu() {
  const { session, canWrite, logout } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="app-sidebar" aria-label="Navegação principal">
      <div className="app-logo">
        <span className="app-logo-mark" aria-hidden="true">
          <Icon size={18}>
            <rect x="8" y="8" width="8" height="12" rx="4" />
            <path d="M9 8a3 3 0 0 1 6 0" />
            <path d="M8 12H4m16 0h-4M8 16H5m14 0h-3" />
            <path d="M9 5 7.5 3.5M15 5l1.5-1.5" />
          </Icon>
        </span>
        Qa TestRunner
      </div>

      <OperationSwitcher />
      <ProjectSwitcher />

      <ul className="app-nav-list">
        {SECTIONS.map((section) => (
          <li key={section.to}>
            <NavLink to={section.to} className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
              <span className="app-nav-icon">{section.icon}</span>
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="app-sidebar-footer">
        <PublishUpdateButton />
        <button type="button" className="app-logout" onClick={toggleTheme}>
          {theme === 'dark' ? SunIcon : MoonIcon}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button type="button" className="app-logout" onClick={logout}>
          {LogoutIcon}
          Logout
        </button>
        <div className="app-session-card">
          <Avatar name={session?.displayName} />
          <span>
            <div style={{ font: 'var(--font-label)', fontWeight: 700 }}>{session?.displayName}</div>
            <div className="app-session-role">{canWrite ? 'Acesso completo' : 'Somente leitura'}</div>
          </span>
        </div>
        <div className="app-version" title={BUILD_TIME ? `Build de ${BUILD_TIME}` : undefined}>
          v{APP_VERSION}
          {BUILD_TIME ? <span className="app-version-build"> · {BUILD_TIME}</span> : null}
        </div>
      </div>
    </nav>
  );
}
