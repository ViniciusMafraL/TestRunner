import { useEffect, useState } from 'react';
import { Status } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { UNRECOGNIZED_STATUS_KEY } from 'shared/groupByStatus.js';
import { issueStatusCategory, issueStatusSlug } from '../../utils/statusCategory.js';
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
import { StatusPill, StatusPillSelect } from '../../components/StatusPill/StatusPill.jsx';
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

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance' };

function severitySlug(severity) {
  return SEVERITY_SLUG[severity] ?? 'muted';
}

function statusLabel(status) {
  return status === UNRECOGNIZED_STATUS_KEY ? 'Não reconhecido' : status;
}

function groupSlug(status) {
  return status === UNRECOGNIZED_STATUS_KEY ? 'desconhecido' : issueStatusSlug(status);
}

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

const FilterIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="10" y1="17" x2="14" y2="17" />
  </svg>
);

const LinkIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

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

  const allIssues = groups.flatMap((group) => group.issues);
  const openCount = allIssues.filter((issue) => issueStatusCategory(issue.status) === 'aberta').length;
  const criticalCount = allIssues.filter((issue) => issue.severity === 'Critical').length;

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
      const issues = previousGroups.flatMap((group) => group.issues);
      const updatedIssues = issues.map((issue) => (issue.id === id ? { ...issue, status } : issue));
      const knownStatuses = [...Status, UNRECOGNIZED_STATUS_KEY];
      return knownStatuses.map((groupStatus) => ({
        status: groupStatus,
        issues: updatedIssues.filter((issue) =>
          groupStatus === UNRECOGNIZED_STATUS_KEY ? !Status.includes(issue.status) : issue.status === groupStatus,
        ),
      }));
    });
  }

  /**
   * Edição de campos pela janela de detalhes (PATCH /issues/:id). Diferente do
   * status, o save é explícito (formulário), então aguarda a persistência e só
   * então aplica localmente — o modal trata o erro e mantém o modo de edição.
   */
  async function handleIssueUpdate(id, patch) {
    const updated = await api.updateIssue(id, patch);
    setGroups((previousGroups) =>
      previousGroups.map((group) => ({
        ...group,
        issues: group.issues.map((issue) => (issue.id === updated.id ? updated : issue)),
      })),
    );
    setSelectedIssue(updated);
    return updated;
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
        <StatusPillSelect
          value={issue.status}
          options={Status}
          onChange={(status) => handleStatusChange(issue.id, status)}
          ariaLabel={`Status da issue ${issue.id}`}
        />
      ) : (
        <StatusPill status={issue.status} />
      );
    }
    if (field === 'severity') {
      return issue.severity ? (
        <span className={`severity-chip severity-chip--${severitySlug(issue.severity)}`}>{issue.severity}</span>
      ) : (
        ''
      );
    }
    if (field === 'keywords') {
      return issue.keywords ? <span className="keyword-chip">{issue.keywords}</span> : '';
    }
    if (field === 'tag') {
      return issue.tag ? <span className="tag-chip">{issue.tag}</span> : '';
    }
    if (field === 'version') {
      return <span className="cell-mono">{issue.version}</span>;
    }
    if (field === 'attachment') {
      const value = String(issue.attachment ?? '');
      if (!value) return '';
      if (!value.startsWith('http')) return value;
      return (
        <a className="attachment-link" href={value} target="_blank" rel="noreferrer">
          {LinkIcon}
          <span className="table-cell-ellipsis">{value}</span>
        </a>
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
      <PageHeader
        breadcrumb=""
        title="Issue Tracker"
        right={
          <label className="search-pill" style={{ flex: 1, maxWidth: 640 }}>
            {SearchIcon}
            <input
              type="search"
              aria-label="Buscar por Title ou ID"
              placeholder="Buscar por Title ou ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        }
      />
      {error ? (
        <p role="alert" style={{ color: 'var(--color-status-error)' }}>
          {error}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
        <button type="button" className="chip-button" title="Em breve">
          {FilterIcon}
          Filters
        </button>
        <ColumnVisibilityMenu
          fields={ISSUE_TRACKER_COLUMN_ORDER.map((field) => ({ field, label: ISSUE_FIELD_LABELS[field] }))}
          isVisible={isVisible}
          onToggle={toggle}
          alwaysVisibleFields={ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS}
        />
        <span style={{ flex: 1 }} />
        <span className="stat-chip">
          <span className="stat-chip-dot" style={{ background: 'var(--color-violet)' }} />
          {openCount} Open Issues
        </span>
        <span className="stat-chip">
          <span className="stat-chip-dot" style={{ background: 'var(--color-status-error)' }} />
          {criticalCount} Critical
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        {loading ? <Loading variant="overlay" /> : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {groups.map((group) => {
            const filteredIssues = group.issues.filter((issue) => matchesIssueSearch(issue, query));
            return (
              <section key={group.status} className="issue-group">
                <button
                  type="button"
                  className="issue-group-header"
                  onClick={() => setCollapsed((previous) => ({ ...previous, [group.status]: !previous[group.status] }))}
                >
                  <span aria-hidden="true">{collapsed[group.status] ? '▸' : '▾'}</span>
                  <span className={`status-dot status-dot--${groupSlug(group.status)}`} />
                  {statusLabel(group.status)}
                  <span className="count-pill">{filteredIssues.length}</span>
                </button>

                {!collapsed[group.status] ? (
                  <div className="table-scroll-wrapper">
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
        onIssueUpdate={canWrite ? handleIssueUpdate : undefined}
      />

      <FloatingActionButton to="/reporter" label="New Report" />
    </div>
  );
}
