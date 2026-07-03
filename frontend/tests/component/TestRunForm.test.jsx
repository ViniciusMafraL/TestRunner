import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { TestRunForm } from '../../src/components/TestRunForm/TestRunForm.jsx';

describe('TestRunForm (componente)', () => {
  it('bloqueia envio sem Build, Version ou Responsável', async () => {
    const onSubmit = vi.fn();
    render(<TestRunForm onSubmit={onSubmit} onClose={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Solicitar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Build, Version e Responsável/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia o formulário completo', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<TestRunForm onSubmit={onSubmit} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/Build/), 'build-500');
    await userEvent.type(screen.getByLabelText(/Version/), '5.0.0');
    await userEvent.type(screen.getByLabelText(/Responsável/), 'Karen');
    await userEvent.click(screen.getByRole('button', { name: 'Solicitar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ build: 'build-500', version: '5.0.0', responsible: 'Karen' }));
  });

  it('campo Responsável é um texto livre, aceitando qualquer nome', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TestRunForm onSubmit={onSubmit} onClose={() => {}} />);

    const responsibleField = screen.getByLabelText(/Responsável/);
    expect(responsibleField).not.toHaveRole('combobox');
    expect(responsibleField.tagName).toBe('INPUT');

    await userEvent.type(screen.getByLabelText(/Build/), 'build-501');
    await userEvent.type(screen.getByLabelText(/Version/), '5.0.1');
    await userEvent.type(responsibleField, 'Fulano da Silva');
    await userEvent.click(screen.getByRole('button', { name: 'Solicitar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ responsible: 'Fulano da Silva' }));
  });
});
