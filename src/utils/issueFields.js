export const ISSUE_FIELDS = [
  'id',
  'status',
  'project',
  'severity',
  'tag',
  'title',
  'description',
  'attachment',
  'foundBy',
  'version',
  'platform',
  'keywords',
  'store',
  'createdIn',
];

export const ISSUE_FIELD_LABELS = {
  id: 'ID',
  status: 'Status',
  project: 'Project',
  severity: 'Severity',
  tag: 'Tag',
  title: 'Title',
  description: 'Description',
  attachment: 'Attachment',
  foundBy: 'Found By',
  version: 'Version',
  platform: 'Platform',
  keywords: 'Keywords',
  store: 'Store',
  createdIn: 'Created In',
};

/** Colunas padrão do Issue Tracker (FR-034), sem ID. */
export const ISSUE_TRACKER_DEFAULT_VISIBLE_FIELDS = ['status', 'project', 'title', 'severity', 'foundBy', 'version', 'keywords', 'store'];

/** Title nunca pode ser desmarcado no seletor de colunas (Assumption do spec 002). */
export const ISSUE_TRACKER_ALWAYS_VISIBLE_FIELDS = ['title'];

/** Ordem de exibição quando a coluna está visível — padrão primeiro, opcionais depois. */
export const ISSUE_TRACKER_COLUMN_ORDER = [
  'status',
  'project',
  'title',
  'severity',
  'foundBy',
  'version',
  'keywords',
  'store',
  'id',
  'tag',
  'platform',
  'description',
  'attachment',
  'createdIn',
];
