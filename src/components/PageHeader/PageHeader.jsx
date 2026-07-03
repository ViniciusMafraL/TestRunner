export function PageHeader({ breadcrumb, title, right }) {
  return (
    <header className="page-header">
      {breadcrumb ? <div className="page-header-breadcrumb">{breadcrumb}</div> : null}
      <div className="page-header-row">
        <h1 className="page-header-title">{title}</h1>
        {right ?? null}
      </div>
    </header>
  );
}
