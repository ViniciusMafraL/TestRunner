import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnVisibilityMenu } from '../../src/components/ColumnVisibilityMenu/ColumnVisibilityMenu.jsx';

describe('ColumnVisibilityMenu (componente)', () => {
  const fields = [
    { field: 'title', label: 'Title' },
    { field: 'severity', label: 'Severity' },
  ];

  it('abre a janela e alterna uma coluna via checkbox', async () => {
    const onToggle = vi.fn();
    render(<ColumnVisibilityMenu fields={fields} isVisible={() => true} onToggle={onToggle} alwaysVisibleFields={['title']} />);

    await userEvent.click(screen.getByRole('button', { name: 'Colunas' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Severity' }));
    expect(onToggle).toHaveBeenCalledWith('severity');
  });

  it('a checkbox do campo sempre-visível aparece desabilitada e marcada', async () => {
    render(<ColumnVisibilityMenu fields={fields} isVisible={() => true} onToggle={() => {}} alwaysVisibleFields={['title']} />);

    await userEvent.click(screen.getByRole('button', { name: 'Colunas' }));

    const titleCheckbox = screen.getByRole('checkbox', { name: 'Title' });
    expect(titleCheckbox).toBeDisabled();
    expect(titleCheckbox).toBeChecked();
  });
});
