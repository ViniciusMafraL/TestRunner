import { useEffect, useState } from 'react';
import { Status } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { UNRECOGNIZED_STATUS_KEY } from 'shared/groupByStatus.js';
import { issueStatusCategory } from '../../utils/statusCategory.js';
import { matchesIssueSearch } from '../../utils/issueSearch.js';
import {
  ISSUE_FIELD_LABELS,
  ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS,
  ISSUE_TRACKER_COLUMN_ORDER,
  ISSUE_TRACKER_DEFAULT_VISIBLE_FIELDS,
} from '../../utils/issueFields.js';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate.js';
import { useColumnVisibility } from '../../hooks/useColumnVisibility.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { IssueDetailModal } from '../../components/IssueDetailModal/IssueDetailModal.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { StatusDot } from '../../components/StatusDot/StatusDot.jsx';
import { AvatarWithLabel } from '../../components/Avatar/Avatar.jsx';
import { Loading } from '../../components/Loading/Loading.jsx';
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu/ColumnVisibilityMenu.jsx';
import { FloatingActionButton } from '../../components/FloatingActionButton/FloatingActionButton.jsx';

const COLUMN_WIDTHS = {
  checkbox: 32,
  id: 90,
  status: 150,
  severity: 110,
  tag: 90,
  title: 220,
  description: 220,
  attachment: 160,
  foundBy: 150,
  version: 90,
  platform: 100,
  keywords: 120,
  store: 150,
  createdIn: 110,
};

const VISIBILITY_STORAGE_KEY = 'issueTracker.visibleColumns.v1';

function statusLabel(status) {
  return status === UNRECOGNIZED_STATUS_KEY ? 'Não reconhecido' : status;
}

function groupCategory(status) {
  return status === UNRECOGNIZED_STATUS_KEY ? 'desconhecido' : issueStatusCategory(status);
}

export function IssueTracker() {
  const { canWrite } = useSession();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [query, setQuery] = useState('');
  const { run, error } = useOptimisticUpdate();
  const { isVisible, toggle } = useColumnVisibility(
    VISIBILITY_STORAGE_KEY,
    Object.keys(ISSUE_FIELD_LABELS),
    ISSUE_TRACKER_DEFAULT_VISIBLE_FIELDS,
    ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS,
  );

  const visibleColumns = ISSUE_TRACKER_COLUMN_ORDER.filter((field) => isVisible(field));
  const tableMinWidth = COLUMN_WIDTHS.checkbox + visibleColumns.reduce((total, field) => total + (COLUMN_WIDTHS[field] ?? 120), 0);

  async function loadGroups() {
    setLoading(true);
    const data = await api.getIssuesGroupedByStatus();
    setGroups(data.groups);
    setLoading(false);
  }

  useEffect(() => {
    loadGroups();
  }, []);

  function findIssue(id) {
    for (const group of groups) {
      const found = group.issues.find((issue) => issue.id === id);
      if (found) return found;
    }
    return null;
  }

  function applyStatusLocally(id, status) {
    setGroups((previousGroups) => {
      const allIssues = previousGroups.flatMap((group) => group.issues);
      const updatedIssues = allIssues.map((issue) => (issue.id === id ? { ...issue, status } : issue));
      const knownStatuses = [...Status, UNRECOGNIZED_STATUS_KEY];
      return knownStatuses.map((groupStatus) => ({
        status: groupStatus,
        issues: updatedIssues.filter((issue) =>
          groupStatus === UNRECOGNIZED_STATUS_KEY ? !Status.includes(issue.status) : issue.status === groupStatus,
        ),
      }));
    });
  }

  function handleStatusChange(id, nextStatus) {
    const issue = findIssue(id);
    if (!issue) return;
    run({
      previousValue: issue.status,
      nextValue: nextStatus,
      applyLocally: (status) => applyStatusLocally(id, status),
      persist: (status) => api.updateIssueStatus(id, status),
    });
  }

  function renderCell(issue, field) {
    if (field === 'status') {
      return canWrite ? (
        <select value={issue.status} onChange={(event) => handleStatusChange(issue.id, event.target.value)}>
          {!Status.includes(issue.status) ? <option value={issue.status}>{issue.status}</option> : null}
          {Status.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ) : (
        <StatusDot status={issue.status} category={issueStatusCategory(issue.status)} />
      );
    }
    if (field === 'foundBy') {
      return <AvatarWithLabel name={issue.foundBy} />;
    }
    if (field === 'title') {
      return (
        <span onClick={() => setSelectedIssue(issue)} style={{ cursor: 'pointer' }}>
          {issue.title}
        </span>
      );
    }
    return String(issue[field] ?? '');
  }

  return (
    <div>
      <PageHeader breadcrumb="" title="Issue Tracker" />
      {error ? (
        <p role="alert" style={{ color: 'var(--color-status-error)' }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <input
          type="search"
          aria-label="Buscar por Title ou ID"
          placeholder="Buscar por Title ou ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ flex: 1 }}
        />
        <ColumnVisibilityMenu
          fields={ISSUE_TRACKER_COLUMN_ORDER.map((field) => ({ field, label: ISSUE_FIELD_LABELS[field] }))}
          isVisible={isVisible}
          onToggle={toggle}
          alwaysVisibleFields={ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS}
        />
      </div>

      <div style={{ position: 'relative' }}>
        {loading ? <Loading variant="overlay" /> : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {groups.map((group) => {
            const filteredIssues = group.issues.filter((issue) => matchesIssueSearch(issue, query));
            return (
              <section key={group.status} className="card">
                <button
                  type="button"
                  onClick={() => setCollapsed((previous) => ({ ...previous, [group.status]: !previous[group.status] }))}
                  style={{
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 0,
                    font: 'var(--font-heading-3)',
                  }}
                >
                  <span aria-hidden="true">{collapsed[group.status] ? '▸' : '▾'}</span>
                  <span className={`status-dot status-dot--${groupCategory(group.status)}`} />
                  {statusLabel(group.status)}
                  <span className="count-pill">{filteredIssues.length}</span>
                </button>

                {!collapsed[group.status] ? (
                  <div className="table-scroll-wrapper" style={{ marginTop: 'var(--space-3)' }}>
                    <table className="table-fixed" style={{ minWidth: tableMinWidth }}>
                      <thead>
                        <tr>
                          <th style={{ width: COLUMN_WIDTHS.checkbox }}>
                            <input type="checkbox" disabled aria-hidden="true" />
                          </th>
                          {visibleColumns.map((field) => (
                            <th key={field} style={{ width: COLUMN_WIDTHS[field] }}>
                              {ISSUE_FIELD_LABELS[field]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIssues.map((issue) => (
                          <tr key={issue.id}>
                            <td>
                              <input type="checkbox" disabled aria-hidden="true" />
                            </td>
                            {visibleColumns.map((field) => (
                              <td key={field} className="table-cell-ellipsis">
                                {renderCell(issue, field)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusChange={canWrite ? handleStatusChange : undefined}
      />

      <FloatingActionButton to="/reporter" label="Report" />
    </div>
  );
}
