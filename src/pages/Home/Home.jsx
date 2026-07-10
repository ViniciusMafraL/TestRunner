import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useOperations } from '../../operations/OperationContext.jsx';
import { IssueDetailModal } from '../../components/IssueDetailModal/IssueDetailModal.jsx';
import { Loading } from '../../components/Loading/Loading.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { StatusPill } from '../../components/StatusPill/StatusPill.jsx';
import { AvatarGroup } from '../../components/Avatar/Avatar.jsx';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance', Normal: 'normal' };

const COLUMN_WIDTHS = {
  status: 120,
  severity: 110,
  foundBy: 150,
  version: 90,
  tag: 90,
};

export function Home() {
  const { currentOperation, currentProject } = useOperations();
  const [summary, setSummary] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recarrega ao trocar de operação OU de projeto (o resumo é do projeto/aba atual).
  useEffect(() => {
    if (!currentOperation || !currentProject) return undefined;
    let cancelled = false;
    setLoading(true);
    api.getHomeSummary().then((data) => {
      if (!cancelled) {
        setSummary(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentOperation, currentProject]);

  if (loading || !summary) {
    return (
      <div>
        <PageHeader breadcrumb="" title="Home" />
        <Loading variant="block" />
      </div>
    );
  }

  const { open, done, closed } = summary.counts;
  const total = open + done + closed;
  const completionRate = total > 0 ? Math.round(((done + closed) / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        breadcrumb=""
        title="Home"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ font: 'var(--font-label)' }}>Concluído</span>
            <div
              style={{
                width: 120,
                height: 8,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-border-200)',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--color-lime)' }} />
            </div>
            <span className="count-pill">{completionRate}%</span>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ font: 'var(--font-caption)', color: 'var(--color-gray-600)' }}>Abertas</div>
          <div style={{ font: 'var(--font-display)' }}>{open}</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ font: 'var(--font-caption)', color: 'var(--color-gray-600)' }}>Concluídas</div>
          <div style={{ font: 'var(--font-display)' }}>{done}</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ font: 'var(--font-caption)', color: 'var(--color-gray-600)' }}>Fechadas</div>
          <div style={{ font: 'var(--font-display)' }}>{closed}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ font: 'var(--font-heading-3)', marginBottom: 'var(--space-4)' }}>Issues abertas — versão mais recente</h2>
        <div className="table-scroll-wrapper">
          <table className="table-fixed">
            <thead>
              <tr>
                <th style={{ width: COLUMN_WIDTHS.status }}>Status</th>
                <th>Title</th>
                <th style={{ width: COLUMN_WIDTHS.severity }}>Severity</th>
                <th style={{ width: COLUMN_WIDTHS.foundBy }}>Found By</th>
                <th style={{ width: COLUMN_WIDTHS.version }}>Version</th>
                <th style={{ width: COLUMN_WIDTHS.tag }}>Tag</th>
              </tr>
            </thead>
            <tbody>
              {summary.latestVersionOpenIssues.map((issue) => (
                <tr key={issue.id} onClick={() => setSelectedIssue(issue)} style={{ cursor: 'pointer' }}>
                  <td>
                    <StatusPill status={issue.status} />
                  </td>
                  <td className="table-cell-ellipsis">{issue.title}</td>
                  <td className="table-cell-ellipsis">
                    {issue.severity ? (
                      <span className={`severity-chip severity-chip--${SEVERITY_SLUG[issue.severity] ?? 'muted'}`}>{issue.severity}</span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="table-cell-ellipsis">
                    <AvatarGroup names={issue.foundBy} />
                  </td>
                  <td className="table-cell-ellipsis">
                    <span className="cell-mono">{issue.version}</span>
                  </td>
                  <td className="table-cell-ellipsis">{issue.tag ? <span className="tag-chip">{issue.tag}</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </div>
  );
}
