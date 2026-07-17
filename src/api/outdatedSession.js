/**
 * Ponte entre a camada de API e o SessionContext para o caso "sessão de época
 * antiga". Qualquer requisição pode descobrir isso (o backend recusa todas as
 * rotas de dados com OUTDATED_SESSION), e a reação é sempre global — o
 * SessionContext registra o handler aqui e a camada de API o dispara, sem que
 * uma dependa da outra.
 */
let handler = null;

export function onOutdatedSession(callback) {
  handler = callback;
  return () => {
    if (handler === callback) handler = null;
  };
}

export function notifyOutdatedSession() {
  handler?.();
}
