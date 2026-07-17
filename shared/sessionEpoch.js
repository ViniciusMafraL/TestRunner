/**
 * Época de sessão ("force update"): o servidor mantém um contador; todo login
 * carimba a sessão com a época vigente. Quando o admin publica uma atualização,
 * a época avança e toda sessão emitida antes dela passa a ser recusada — o
 * usuário precisa relogar.
 *
 * Lógica pura, compartilhada entre o backend (authMiddleware) e o mock do
 * frontend, para que os dois concordem sobre o que é "sessão desatualizada".
 */

export const FIRST_EPOCH = 1;

/** Código de erro devolvido a quem apresenta uma sessão de época anterior. */
export const OUTDATED_SESSION_CODE = 'OUTDATED_SESSION';

export const OUTDATED_SESSION_MESSAGE = 'Uma nova versão foi publicada — entre novamente para continuar';

export function normalizeEpoch(value) {
  const epoch = Number(value);
  return Number.isInteger(epoch) && epoch >= FIRST_EPOCH ? epoch : FIRST_EPOCH;
}

/**
 * Sessão sem época (emitida antes deste recurso existir) conta como
 * desatualizada assim que a época avança: `undefined` normaliza para a primeira
 * época, então qualquer bump a invalida — que é o comportamento desejado para
 * "save local/cookie antigo".
 *
 * A comparação é `<` (não `!==`) de propósito: se a época do servidor regredir
 * por qualquer motivo, sessões mais novas seguem válidas em vez de todo mundo
 * ser deslogado sem motivo.
 */
export function isSessionOutdated(sessionEpoch, currentEpoch) {
  return normalizeEpoch(sessionEpoch) < normalizeEpoch(currentEpoch);
}
