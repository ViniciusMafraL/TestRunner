/**
 * Keywords múltiplas ("UX, Bug, Incomplete", formato da planilha) viram um
 * chip por palavra, quebrando linha quando não cabem.
 */
export function KeywordChips({ value }) {
  const list = String(value ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  if (list.length === 0) return null;
  return (
    <span className="keyword-chips">
      {list.map((keyword) => (
        <span key={keyword} className="keyword-chip">
          {keyword}
        </span>
      ))}
    </span>
  );
}
