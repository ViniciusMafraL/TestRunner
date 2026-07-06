/* Ícones de linha (14px) para rótulos de campo de issue — compartilhados entre
   o formulário do Reporter e o modal de detalhe. */
function FieldIcon({ children }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const FIELD_ICONS = {
  version: (
    <FieldIcon>
      <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
    </FieldIcon>
  ),
  severity: (
    <FieldIcon>
      <path d="m12 3 10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </FieldIcon>
  ),
  foundBy: (
    <FieldIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </FieldIcon>
  ),
  platform: (
    <FieldIcon>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </FieldIcon>
  ),
  tag: (
    <FieldIcon>
      <path d="m3 12 9-9h9v9l-9 9z" />
      <circle cx="16.5" cy="7.5" r="1" />
    </FieldIcon>
  ),
  keywords: (
    <FieldIcon>
      <path d="M7 7h.01M4 4h7l9 9-7 7-9-9z" />
    </FieldIcon>
  ),
  store: (
    <FieldIcon>
      <path d="M4 8 6 3h12l2 5M4 8h16v13H4zM9 12h6" />
    </FieldIcon>
  ),
  attachment: (
    <FieldIcon>
      <path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L16 7" />
    </FieldIcon>
  ),
  createdIn: (
    <FieldIcon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </FieldIcon>
  ),
};
