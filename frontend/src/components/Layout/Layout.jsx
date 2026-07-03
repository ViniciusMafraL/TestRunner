import { Outlet } from 'react-router-dom';
import { SideMenu } from '../SideMenu/SideMenu.jsx';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary.jsx';

export function Layout() {
  return (
    <div className="app-shell">
      <SideMenu />
      <main className="app-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
