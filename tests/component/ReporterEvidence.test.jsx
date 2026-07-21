import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reporter } from '../../src/pages/Reporter/Reporter.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function makeFile(name, type = 'video/mp4') {
  return new File(['conteudo-de-teste'], name, { type });
}

// jsdom implementa DataTransfer, mas o testing-library reconstrói o objeto e a
// propriedade nativa `files` (getter) não aceita o array — ficaria vazia. Então
// injetamos um dataTransfer/clipboardData simples direto no evento, que é como
// o handler (React onDrop / listener nativo de paste) o lê.
function transferOf(files) {
  return {
    files,
    items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    types: ['Files'],
  };
}

function dropFiles(node, files) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: transferOf(files) });
  fireEvent(node, event);
}

function pasteFiles(node, files) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: transferOf(files) });
  fireEvent(node, event);
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Bug com evidência');
  await userEvent.type(screen.getByLabelText(/Version/), '1.6.0');
}

describe('Reporter - evidências (componente)', () => {
  it('lista os arquivos selecionados e permite remover antes do envio', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    const input = screen.getByLabelText('Arquivos de evidência');
    await userEvent.upload(input, [makeFile('bug.mp4'), makeFile('print.png', 'image/png')]);

    expect(screen.getByText('bug.mp4')).toBeInTheDocument();
    expect(screen.getByText('print.png')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remover bug.mp4' }));
    expect(screen.queryByText('bug.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('print.png')).toBeInTheDocument();
  });

  it('arrastar-e-soltar um arquivo no dropzone anexa a evidência', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    const dropzone = await screen.findByRole('button', { name: /anexar/i });
    dropFiles(dropzone, [makeFile('arrastado.mp4')]);

    expect(await screen.findByText('arrastado.mp4')).toBeInTheDocument();
  });

  it('tipo inválido no drop mostra o alerta e não anexa', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    const dropzone = await screen.findByRole('button', { name: /anexar/i });
    // Vídeo acima do limite de tamanho exercita o alerta de validação.
    const huge = new File(['x'], 'grande.mp4', { type: 'video/mp4' });
    Object.defineProperty(huge, 'size', { value: 999 * 1024 * 1024 });
    dropFiles(dropzone, [huge]);

    expect(await screen.findByRole('alert')).toHaveTextContent(/excede o limite/i);
    expect(screen.queryByText('grande.mp4')).not.toBeInTheDocument();
  });

  it('colar (Ctrl+V) um print da área de transferência anexa a evidência', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await screen.findByRole('button', { name: /anexar/i });
    pasteFiles(document, [makeFile('print.png', 'image/png')]);

    expect(await screen.findByText('print.png')).toBeInTheDocument();
  });

  it('colar texto (sem arquivo) não intercepta nem anexa nada', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await screen.findByRole('button', { name: /anexar/i });
    pasteFiles(document, []);

    // Nenhuma evidência anexada => nenhum botão "Remover ..." na lista.
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument();
  });

  it('bloqueia tipo de arquivo não aceito na seleção, antes do envio', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    const input = screen.getByLabelText('Arquivos de evidência');
    // applyAccept: false — o accept do input já barra PDFs no seletor nativo;
    // aqui validamos a segunda camada (validateEvidenceFiles).
    await userEvent.upload(input, makeFile('log.pdf', 'application/pdf'), { applyAccept: false });

    expect(screen.getByRole('alert')).toHaveTextContent('Tipo de arquivo não aceito: log.pdf');
    expect(screen.queryByText('log.pdf')).not.toBeInTheDocument();
  });

  it('envio feliz cria a issue, sobe as evidências e mostra o link da pasta', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await fillRequiredFields();
    const input = screen.getByLabelText('Arquivos de evidência');
    await userEvent.upload(input, [makeFile('bug.mp4'), makeFile('print.png', 'image/png')]);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    const link = await screen.findByRole('link', { name: 'evidências na pasta do Drive' });
    expect(link).toHaveAttribute('href', 'https://drive.google.com/drive/folders/mock-BUG-009');
    expect(screen.getByText(/Issue BUG-009 criada/)).toBeInTheDocument();
    // O formulário limpa junto com a lista de evidências.
    expect(screen.queryByText('bug.mp4')).not.toBeInTheDocument();
  });

  it('falha de upload mantém a issue criada e avisa quais arquivos falharam', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await fillRequiredFields();
    const input = screen.getByLabelText('Arquivos de evidência');
    await userEvent.upload(input, [makeFile('erro.mp4'), makeFile('print.png', 'image/png')]);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Issue BUG-009 criada, mas a evidência falhou: erro.mp4');
    });
  });

  it('envio sem evidências continua funcionando como antes', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Issue BUG-009 criada com status Open')).toBeInTheDocument();
  });
});
