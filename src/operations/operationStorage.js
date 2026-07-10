// Operação e projeto atuais persistidos no navegador. Mesmas chaves/JSON lidas
// pelo httpClient (headers X-Operation / X-Project) e pelo mock store.
export const CURRENT_OPERATION_KEY = 'testRunner.currentOperation.v1';
export const CURRENT_PROJECT_KEY = 'testRunner.currentProject.v1';

function readString(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeString(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponível: a seleção não persiste, mas a sessão continua.
  }
}

export function readCurrentOperation() {
  return readString(CURRENT_OPERATION_KEY);
}

export function writeCurrentOperation(id) {
  writeString(CURRENT_OPERATION_KEY, id);
}

export function readCurrentProject() {
  return readString(CURRENT_PROJECT_KEY);
}

export function writeCurrentProject(name) {
  writeString(CURRENT_PROJECT_KEY, name);
}
