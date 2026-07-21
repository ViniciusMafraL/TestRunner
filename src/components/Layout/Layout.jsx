import { Outlet } from 'react-router-dom';
import { OperationProvider } from '../../operations/OperationContext.jsx';
import { SideMenu } from '../SideMenu/SideMenu.jsx';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary.jsx';
import { OutdatedSessionGate } from '../OutdatedSessionGate/OutdatedSessionGate.jsx';
import { FtueOperationGate } from '../FtueOperationGate/FtueOperationGate.jsx';

export function Layout() {
  return (
    <OperationProvider>
      <div className="app-shell">
        <SideMenu />
        <main className="app-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      {/* Fora do shell para cobrir a tela inteira, sidebar inclusive. */}
      <OutdatedSessionGate />
      <FtueOperationGate />
    </OperationProvider>
  );
}
