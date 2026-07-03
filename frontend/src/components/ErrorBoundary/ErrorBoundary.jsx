import { Component } from 'react';

/**
 * Garante FR-019: dado inesperado nunca deve resultar em tela em branco.
 * Qualquer erro de renderização não tratado localmente cai aqui em vez de
 * derrubar a aplicação inteira.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" role="alert">
          <h2>Algo deu errado nesta tela</h2>
          <p>Tente recarregar a página. Se o problema continuar, avise a equipe.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
