// Log de mudanças de status da issue, guardado como texto simples numa única
// célula (coluna "Log" da planilha). Cada entrada é uma linha
// "<ISO>\t<ator>\t<status>[\t<nota>]", com as mais recentes no topo. Fonte única
// de formato, reusada pelo backend, pelo mock e pela UI (que faz o parse).

// Status que atribuem o responsável a quem fez a mudança. "Reopen" fica de fora
// de propósito: o dev que mexeu por último segue responsável pelo bug reaberto.
export const RESPONSIBLE_STATUSES = ['In progress', 'To review', 'Fixed For Next Build'];

export function statusAssignsResponsible(status) {
  return RESPONSIBLE_STATUSES.includes(status);
}

/**
 * Tab e quebra de linha são os separadores do formato — qualquer um deles vindo
 * de texto do usuário (a nota do reteste) corromperia o log. Viram espaço.
 */
function sanitizeField(value) {
  return String(value ?? '')
    .replace(/[\t\r\n]+/g, ' ')
    .trim();
}

/**
 * Acrescenta uma entrada ao topo do log e devolve o texto novo. Sem ator (ex.:
 * chamada sem sessão), devolve o log inalterado — não registra entrada anônima.
 * `note` é um 4º campo opcional (ex.: "reteste reprovado · versão 1.6.0"); sem
 * ela a linha sai com 3 campos, idêntica às já gravadas.
 */
export function appendStatusLogEntry(existingLog, { actor, status, note = '', at = new Date() }) {
  const name = sanitizeField(actor);
  if (!name) return String(existingLog ?? '');
  const iso = (at instanceof Date ? at : new Date(at)).toISOString();
  const cleanNote = sanitizeField(note);
  const line = `${iso}\t${name}\t${sanitizeField(status)}${cleanNote ? `\t${cleanNote}` : ''}`;
  const previous = String(existingLog ?? '');
  return previous ? `${line}\n${previous}` : line;
}

/**
 * Faz o parse do texto do log em entradas [{ at, actor, status, note }], das
 * mais recentes para as mais antigas. Linhas malformadas são descartadas; as de
 * 3 campos (gravadas antes da nota existir) devolvem note ''.
 */
export function parseIssueLog(logString) {
  return String(logString ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [at, actor, status, note] = line.split('\t');
      return { at, actor, status, note: note ?? '' };
    })
    .filter((entry) => entry.actor && entry.status);
}

/**
 * Nota do log para o fluxo de reteste do QA, derivada da transição — o servidor
 * a monta sozinho, sem confiar em texto vindo do cliente. Transições fora do
 * reteste devolvem '' e o log segue exatamente como antes.
 */
export function retestLogNote(previousStatus, nextStatus, retest) {
  if (previousStatus === 'To review' && nextStatus === 'Fixed') return 'reteste aprovado';
  if (nextStatus === 'Reopen') {
    const version = sanitizeField(retest?.version);
    return version ? `reteste reprovado · versão ${version}` : 'reteste reprovado';
  }
  return '';
}

/** 'YYYY-MM-DD' ou Date → 'DD/MM/YYYY' (formato usado no corpo da descrição). */
function formatDayMonthYear(at) {
  const date = at instanceof Date ? at : new Date(at);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Acrescenta ao fim da descrição o registro de um reteste reprovado. Fica na
 * descrição (e não só no log) porque é o que quem abre a issue lê primeiro:
 *
 *   [Reopen 22/07/2026 · Karen · retestado na versão 1.6.0]
 *   <comentário do QA, se houver>
 */
export function appendReopenNote(description, { actor, version, comment, at = new Date() } = {}) {
  const previous = String(description ?? '').trimEnd();
  const parts = [`Reopen ${formatDayMonthYear(at)}`];
  const name = sanitizeField(actor);
  if (name) parts.push(name);
  const cleanVersion = sanitizeField(version);
  if (cleanVersion) parts.push(`retestado na versão ${cleanVersion}`);

  const header = `[${parts.join(' · ')}]`;
  const body = String(comment ?? '').trim();
  const block = body ? `${header}\n${body}` : header;
  return previous ? `${previous}\n\n${block}` : block;
}
