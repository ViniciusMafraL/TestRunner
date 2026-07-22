import { useEffect, useState } from 'react';
import { Status } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { useOperations } from '../../operations/OperationContext.jsx';
import { boardUrlForOperation } from '../../operations/operationBoards.js';
import { IssueDetailModal } from '../../components/IssueDetailModal/IssueDetailModal.jsx';
import { Loading } from '../../components/Loading/Loading.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { StatusPill } from '../../components/StatusPill/StatusPill.jsx';
import { AvatarGroup } from '../../components/Avatar/Avatar.jsx';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance', Normal: 'normal' };

const BoardIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const ExternalLinkIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
);

function OperationBoardButton({ operationId }) {
  const url = boardUrlForOperation(operationId);
  if (!url) return null;
  return (
    <a className="chip-button" href={url} target="_blank" rel="noreferrer">
      {BoardIcon}
      Quadro da operação
      {ExternalLinkIcon}
    </a>
  );
}

/**
 * Largura da coluna Status derivada do rótulo mais longo do enum. A tabela é
 * `table-layout: fixed` e a pílula usa `white-space: nowrap`, então uma largura
 * fixa fazia um status longo (ex.: "Fixed For Next Build") vazar por cima do
 * Title. Assim a Home se reajusta sozinha quando um status novo entra ou é
 * renomeado, sem número mágico para manter.
 *
 * O acréscimo cobre o que não é texto: o "cromo" da pílula (padding 2×10px,
 * gap 6px e ponto de 7px) mais o padding da célula (2×var(--space-3)).
 */
const LONGEST_STATUS_CHARS = Math.max(...Status.map((status) => status.length));
const STATUS_COLUMN_WIDTH = `calc(${LONGEST_STATUS_CHARS}ch + 3.75rem)`;

const COLUMN_WIDTHS = {
  status: STATUS_COLUMN_WIDTH,
  severity: 110,
  foundBy: 150,
  version: 90,
  tag: 90,
};

export function Home() {
  const { currentOperation, currentProject, projects } = useOperations();
  const [summary, setSummary] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recarrega ao trocar de operação OU de projeto (o resumo é do projeto/aba atual).
  // Só busca quando o projeto atual já pertence à operação atual: ao trocar de
  // operação, `projects` é esvaziado e o projeto antigo ainda está selecionado
  // por um instante — buscar aí mandaria um X-Project inválido (404). Esperar a
  // lista nova reconciliar evita o erro transitório no console.
  useEffect(() => {
    if (!currentOperation || !currentProject || !projects.includes(currentProject)) return undefined;
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
  }, [currentOperation, currentProject, projects]);

  if (loading || !summary) {
    return (
      <div>
        <PageHeader breadcrumb="" title="Home" right={<OperationBoardButton operationId={currentOperation} />} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <OperationBoardButton operationId={currentOperation} />
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
