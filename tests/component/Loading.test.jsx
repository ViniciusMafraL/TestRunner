import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../../src/components/Loading/Loading.jsx';

describe('Loading (componente)', () => {
  it('variante "block" renderiza o indicador ocupando o espaço do conteúdo', () => {
    render(<Loading variant="block" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('variante "overlay" renderiza o indicador sobreposto sem ocultar o conteúdo ao lado', () => {
    render(
      <div style={{ position: 'relative' }}>
        <p>Conteúdo por baixo</p>
        <Loading variant="overlay" />
      </div>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo por baixo')).toBeInTheDocument();
  });
});
