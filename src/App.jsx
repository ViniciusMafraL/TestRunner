import { Navigate, Route, Routes } from 'react-router-dom';
import { SessionProvider } from './auth/SessionContext.jsx';
import { ProtectedRoute } from './auth/ProtectedRoute.jsx';
import { Layout } from './components/Layout/Layout.jsx';
import { Login } from './pages/Login/Login.jsx';
import { Home } from './pages/Home/Home.jsx';
import { IssueTracker } from './pages/IssueTracker/IssueTracker.jsx';
import { Reporter } from './pages/Reporter/Reporter.jsx';
import { TestRun } from './pages/TestRun/TestRun.jsx';
import { TestPlan } from './pages/TestPlan/TestPlan.jsx';

export function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          {/* :issueId opcional — /issue-tracker/BUG-001 abre a issue direto (link compartilhável). */}
          <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
          <Route path="/reporter" element={<Reporter />} />
          <Route path="/test-run" element={<TestRun />} />
          <Route path="/test-plan" element={<TestPlan />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </SessionProvider>
  );
}
