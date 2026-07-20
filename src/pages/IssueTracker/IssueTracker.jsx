import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Status } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { UNRECOGNIZED_STATUS_KEY, groupIssuesByStatus } from 'shared/groupByStatus.js';
import { useOperations } from '../../operations/OperationContext.jsx';
import { Dropdown } from '../../components/Dropdown/Dropdown.jsx';
import { issueStatusCategory, issueStatusSlug } from '../../utils/statusCategory.js';
import { matchesIssueSearch } from '../../utils/issueSearch.js';
import { nextSeveritySort, sortIssuesBySeverity } from '../../utils/issueSort.js';
import {
  ISSUE_FIELD_LABELS,
  ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS,
  ISSUE_TRACKER_COLUMN_ORDER,
  ISSUE_TRACKER_DEFAULT_VISIBLE_FIELDS,
} from '../../utils/issueFields.js';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate.js';
import { useColumnVisibility } from '../../hooks/useColumnVisibility.js';
import { useColumnLayout } from '../../hooks/useColumnLayout.js';
import { useColumnReorder } from '../../hooks/useColumnReorder.js';
import { useLocalStorageState } from '../../hooks/useLocalStorageState.js';
import { DEFAULT_COLUMN_WIDTHS, FLEX_COLUMNS } from '../../utils/columnLayout.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { IssueDetailModal } from '../../components/IssueDetailModal/IssueDetailModal.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { StatusPill, StatusPillSelect } from '../../components/StatusPill/StatusPill.jsx';
import { AvatarGroup } from '../../components/Avatar/Avatar.jsx';
import { Loading } from '../../components/Loading/Loading.jsx';
import { ColumnVisibilityMenu } from '../../components/ColumnVisibilityMenu/ColumnVisibilityMenu.jsx';
import { KeywordChips } from '../../components/KeywordChips/KeywordChips.jsx';
import { FloatingActionButton } from '../../components/FloatingActionButton/FloatingActionButton.jsx';
import { SelectionActionsBar } from '../../components/SelectionActionsBar/SelectionActionsBar.jsx';
import { Checkbox } from '../../components/Checkbox/Checkbox.jsx';
import { ColumnHeaderCell } from '../../components/ColumnHeaderCell/ColumnHeaderCell.jsx';

const VISIBILITY_STORAGE_KEY = 'issueTracker.visibleColumns.v1';
const LAYOUT_STORAGE_KEY = 'issueTracker.columnLayout.v1';

/**
 * Status literal gravado ao arquivar em lote. Está fora do enum de Status de
 * propósito: a API aceita valores fora do enum por contrato, e qualquer valor
 * desconhecido cai na seção "Não reconhecido" do tracker — que é onde as
 * issues arquivadas devem aparecer. Na planilha fica o texto legível "Arquivado".
 */
const ARCHIVED_STATUS = 'Arquivado';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance', Normal: 'normal' };

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
  // A issue aberta vive na URL (/issue-tracker/:issueId), não em estado local,
  // para que o link do modal seja compartilhável e o voltar do navegador o feche.
  const { issueId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOperation, currentProject, projects, tagValues, selectOperation, selectProject } = useOperations();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useLocalStorageState('issueTracker.collapsedGroups.v1', {});
  const [query, setQuery] = useState('');
  // Filtro por Tag (localização do bug) — usado sobretudo pela Sportia, que tem
  // 1 projeto e diferencia por Tag. Operações multi-projeto trocam de projeto/aba.
  const [tagFilter, setTagFilter] = useState('all');
  // Ordenação por severidade: efêmera de propósito (volta ao padrão por id ao recarregar).
  const [severitySort, setSeveritySort] = useState('none');
  // Seleção em lote: efêmera de propósito (ação momentânea, não preferência).
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [actionMessage, setActionMessage] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const { run, error } = useOptimisticUpdate();
  const { isVisible, toggle } = useColumnVisibility(
    VISIBILITY_STORAGE_KEY,
    Object.keys(ISSUE_FIELD_LABELS),
    ISSUE_TRACKER_DEFAULT_VISIBLE_FIELDS,
    ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS,
  );
  const layout = useColumnLayout(LAYOUT_STORAGE_KEY, ISSUE_TRACKER_COLUMN_ORDER, DEFAULT_COLUMN_WIDTHS, FLEX_COLUMNS);
  const reorder = useColumnReorder({ onMove: layout.moveColumn });
  const columnsContainerRef = useRef(null);

  const visibleColumns = layout.order.filter((field) => isVisible(field));
  const tableMinWidth =
    DEFAULT_COLUMN_WIDTHS.checkbox + visibleColumns.reduce((total, field) => total + layout.minWidthContribution(field), 0);

  // Larguras commitadas viram CSS vars no container dos grupos — todas as
  // tabelas de grupo compartilham a mesma largura por coluna.
  const columnWidthVars = Object.fromEntries(
    visibleColumns
      .filter((field) => layout.effectiveWidth(field) != null)
      .map((field) => [`--col-${field}`, `${layout.effectiveWidth(field)}px`]),
  );
  const lastVisibleField = visibleColumns[visibleColumns.length - 1];

  function dropSideFor(field) {
    if (!reorder.dragField || !reorder.dropTarget) return null;
    if (reorder.dropTarget.anchor === field) return 'before';
    if (reorder.dropTarget.anchor === null && field === lastVisibleField) return 'after';
    return null;
  }

  const allIssues = groups.flatMap((group) => group.issues);
  const openCount = allIssues.filter((issue) => issueStatusCategory(issue.status) === 'aberta').length;
  const criticalCount = allIssues.filter((issue) => issue.severity === 'Critical').length;

  // Deep-link: /issue-tracker/BUG-1?op=roblox&project=Mini-game X troca a
  // operação e o projeto antes de resolver a issue (IDs se repetem entre abas).
  const opParam = searchParams.get('op');
  const projectParam = searchParams.get('project');
  useEffect(() => {
    if (opParam && opParam !== currentOperation) selectOperation(opParam);
  }, [opParam, currentOperation, selectOperation]);
  useEffect(() => {
    if (projectParam && projectParam !== currentProject) selectProject(projectParam);
  }, [projectParam, currentProject, selectProject]);

  async function loadGroups() {
    setLoading(true);
    const data = await api.getIssuesGroupedByStatus();
    setGroups(data.groups);
    setLoading(false);
  }

  // Recarrega ao trocar de operação OU de projeto (issues vêm da aba do projeto).
  // Só busca quando o projeto atual pertence à operação atual: ao trocar de
  // operação, `projects` é esvaziado e o projeto antigo continua selecionado por
  // um instante — buscar aí mandaria um X-Project inválido (404). Esperar a lista
  // nova reconciliar evita o erro transitório e o request desperdiçado.
  useEffect(() => {
    if (!currentOperation || !currentProject || !projects.includes(currentProject)) return;
    setTagFilter('all');
    loadGroups();
  }, [currentOperation, currentProject, projects]);

  function findIssue(id) {
    for (const group of groups) {
      const found = group.issues.find((issue) => issue.id === id);
      if (found) return found;
    }
    return null;
  }

  const selectedIssue = issueId ? findIssue(issueId) : null;

  // Link compartilhável carrega operação e projeto (a issue vive numa aba).
  const opQuery = currentOperation
    ? `?op=${encodeURIComponent(currentOperation)}${currentProject ? `&project=${encodeURIComponent(currentProject)}` : ''}`
    : '';

  function openIssue(issue) {
    navigate(`/issue-tracker/${encodeURIComponent(issue.id)}${opQuery}`);
  }

  function closeIssue() {
    navigate(`/issue-tracker${opQuery}`);
  }

  function applyStatusLocally(id, status) {
    setGroups((previousGroups) => {
      const updatedIssues = previousGroups
        .flatMap((group) => group.issues)
        .map((issue) => (issue.id === id ? { ...issue, status } : issue));
      return groupIssuesByStatus(updatedIssues);
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

  function toggleIssueSelection(id) {
    setActionMessage(null);
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /**
   * Checkbox do header do grupo: com o modo desligado, liga o modo de seleção
   * e já marca as issues visíveis do grupo (comportamento padrão de "select
   * all"); com o modo ligado, alterna a seleção do grupo respeitando a busca.
   */
  function toggleGroupSelection(filteredIssues) {
    setActionMessage(null);
    const ids = filteredIssues.map((issue) => issue.id);
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set(ids));
      return;
    }
    setSelectedIds((previous) => {
      const next = new Set(previous);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function cancelSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setActionMessage(null);
  }

  function selectedIssuesInOrder() {
    return allIssues.filter((issue) => selectedIds.has(issue.id));
  }

  async function handleCopyLinks() {
    const links = selectedIssuesInOrder().map(
      (issue) => `${window.location.origin}${window.location.pathname}#/issue-tracker/${encodeURIComponent(issue.id)}${opQuery}`,
    );
    try {
      await navigator.clipboard.writeText(links.join('\n'));
      setActionMessage(links.length === 1 ? '1 link copiado' : `${links.length} links copiados`);
    } catch {
      setActionMessage('Não foi possível copiar — a área de transferência está indisponível');
    }
  }

  /**
   * Arquiva as selecionadas uma a uma pelo endpoint existente de status
   * (sem endpoint bulk — YAGNI, ver contracts/api.md). Sequencial de propósito:
   * cada escrita relê a planilha no backend, e paralelizar estoura a quota do
   * Sheets à toa. Falhas parciais mantêm a issue selecionada para nova tentativa.
   */
  async function handleArchive() {
    const ids = selectedIssuesInOrder().map((issue) => issue.id);
    setArchiving(true);
    setActionMessage(null);
    const failed = [];
    for (const id of ids) {
      try {
        await api.updateIssueStatus(id, ARCHIVED_STATUS);
        applyStatusLocally(id, ARCHIVED_STATUS);
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
      } catch {
        failed.push(id);
      }
    }
    setArchiving(false);
    const archivedCount = ids.length - failed.length;
    if (failed.length === 0) {
      setActionMessage(archivedCount === 1 ? '1 issue arquivada' : `${archivedCount} issues arquivadas`);
    } else {
      setActionMessage(`${archivedCount} arquivada(s); falhou em: ${failed.join(', ')}`);
    }
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
      return issue.keywords ? <KeywordChips value={issue.keywords} /> : '';
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
      return <AvatarGroup names={issue.foundBy} />;
    }
    if (field === 'title') {
      return (
        <span onClick={() => openIssue(issue)} style={{ cursor: 'pointer' }}>
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
      {issueId && !loading && !selectedIssue ? (
        <p role="alert" style={{ color: 'var(--color-status-error)' }}>
          Issue {issueId} não encontrada — o link pode estar desatualizado.
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
          onResetLayout={layout.resetLayout}
        />
        {tagValues.length > 0 ? (
          <Dropdown
            ariaLabel="Filtrar por tag"
            value={tagFilter}
            options={['all', ...tagValues]}
            onChange={setTagFilter}
            renderValue={(value) => (value === 'all' ? 'Todas as tags' : value)}
            renderOption={(value) => (value === 'all' ? 'Todas as tags' : value)}
          />
        ) : null}
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

        <div
          ref={columnsContainerRef}
          className={reorder.dragField ? 'is-col-dragging' : undefined}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', ...columnWidthVars }}
        >
          {groups.map((group) => {
            const filteredIssues = sortIssuesBySeverity(
              group.issues.filter(
                (issue) => matchesIssueSearch(issue, query) && (tagFilter === 'all' || issue.tag === tagFilter),
              ),
              severitySort,
            );
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
                          <th style={{ width: DEFAULT_COLUMN_WIDTHS.checkbox }}>
                            <Checkbox
                              ariaLabel={`Selecionar todas as issues do grupo ${statusLabel(group.status)}`}
                              checked={
                                selectionMode &&
                                filteredIssues.length > 0 &&
                                filteredIssues.every((issue) => selectedIds.has(issue.id))
                              }
                              onChange={() => toggleGroupSelection(filteredIssues)}
                            />
                          </th>
                          {visibleColumns.map((field) => (
                            <ColumnHeaderCell
                              key={field}
                              field={field}
                              label={ISSUE_FIELD_LABELS[field]}
                              isDragging={reorder.dragField === field}
                              dropSide={dropSideFor(field)}
                              reorderProps={reorder.getHeaderProps(field)}
                              containerRef={columnsContainerRef}
                              fallbackWidth={layout.minWidthContribution(field)}
                              onResizeCommit={layout.setColumnWidth}
                              sortMode={field === 'severity' ? severitySort : undefined}
                              onCycleSort={
                                field === 'severity' ? () => setSeveritySort((mode) => nextSeveritySort(mode)) : undefined
                              }
                            />
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIssues.map((issue) => (
                          <tr key={issue.id}>
                            <td>
                              {/* Fora do modo de seleção o checkbox some; a célula fica para manter o alinhamento. */}
                              {selectionMode ? (
                                <Checkbox
                                  ariaLabel={`Selecionar issue ${issue.id}`}
                                  checked={selectedIds.has(issue.id)}
                                  onChange={() => toggleIssueSelection(issue.id)}
                                />
                              ) : null}
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
        onClose={closeIssue}
        onStatusChange={canWrite ? handleStatusChange : undefined}
        onIssueUpdate={canWrite ? handleIssueUpdate : undefined}
      />

      {selectionMode ? (
        <SelectionActionsBar
          count={selectedIds.size}
          canWrite={canWrite}
          busy={archiving}
          message={actionMessage}
          onCopyLinks={handleCopyLinks}
          onArchive={handleArchive}
          onCancel={cancelSelection}
        />
      ) : (
        <FloatingActionButton to="/reporter" label="New Report" />
      )}
    </div>
  );
}
