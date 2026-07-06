const CheckIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * Checkbox do design system: input nativo escondido (mantém teclado/leitor de
 * tela) + caixa visual própria, para não depender do widget do navegador —
 * que não segue os tokens do projeto (borda/fundo fixos do SO, sobretudo no
 * modo escuro). Sem `children`, renderiza só a caixa (uso em cabeçalhos de
 * tabela); com `children`, envolve num <label> para virar um item clicável.
 */
export function Checkbox({ checked, onChange, disabled, ariaLabel, children }) {
  const box = (
    <span className={`checkbox${disabled ? ' checkbox--disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} aria-label={ariaLabel} />
      <span className="checkbox-box" aria-hidden="true">
        {CheckIcon}
      </span>
    </span>
  );

  if (children == null) return box;

  return (
    <label className="checkbox-row">
      {box}
      {children}
    </label>
  );
}
