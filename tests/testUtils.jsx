import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext.jsx';
import { OperationProvider } from '../src/operations/OperationContext.jsx';

export function seedSession(session) {
  localStorage.setItem('workflow_session', JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem('workflow_session');
}

export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SessionProvider>
        <OperationProvider>{ui}</OperationProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}
