import { useEffect, useState } from 'react';
import { TestRunStatus } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate.js';
import { TestRunCard } from '../../components/TestRunCard/TestRunCard.jsx';
import { TestRunForm } from '../../components/TestRunForm/TestRunForm.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { testRunStatusCategory } from '../../utils/statusCategory.js';

export function TestRun() {
  const { canWrite } = useSession();
  const [demands, setDemands] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { run, error } = useOptimisticUpdate();

  async function loadDemands() {
    const data = await api.getTestRuns();
    setDemands(data.demands);
  }

  useEffect(() => {
    loadDemands();
  }, []);

  async function handleCreate(payload) {
    await api.createTestRun(payload);
    await loadDemands();
  }

  function applyStatusLocally(id, status) {
    setDemands((previous) => previous.map((demand) => (demand.id === id ? { ...demand, status } : demand)));
  }

  function handleDrop(id, nextStatus) {
    const demand = demands.find((item) => item.id === id);
    if (!demand || demand.status === nextStatus) return;
    run({
      previousValue: demand.status,
      nextValue: nextStatus,
      applyLocally: (status) => applyStatusLocally(id, status),
      persist: (status) => api.updateTestRunStatus(id, status),
    });
  }

  return (
    <div>
      <PageHeader
        breadcrumb=""
        title="Test Run"
        right={
          canWrite ? (
            <button type="button" className="button-primary" onClick={() => setShowForm(true)}>
              Nova demanda
            </button>
          ) : null
        }
      />
      {error ? (
        <p role="alert" style={{ color: 'var(--color-status-error)' }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
        {TestRunStatus.map((status) => {
          const columnDemands = demands.filter((demand) => demand.status === status);
          return (
            <div
              key={status}
              className="card"
              data-testid={`test-run-column-${status}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData('text/plain');
                if (id) handleDrop(id, status);
              }}
            >
              <h2 style={{ font: 'var(--font-heading-3)', display: 'flex', alignItems: 'center' }}>
                <span className={`status-dot status-dot--${testRunStatusCategory(status)}`} />
                {status} ({columnDemands.length})
              </h2>
              {columnDemands.map((demand) => (
                <TestRunCard key={demand.id} demand={demand} canWrite={canWrite} />
              ))}
            </div>
          );
        })}
      </div>

      {showForm ? <TestRunForm onSubmit={handleCreate} onClose={() => setShowForm(false)} /> : null}
    </div>
  );
}
