import { FIRST_EPOCH, normalizeEpoch } from 'shared/sessionEpoch.js';

/**
 * Época do "servidor" no mock. Vive no localStorage (e não em memória) por dois
 * motivos: sobrevive ao reload, e o evento `storage` avisa as outras abas do
 * mesmo browser na hora em que o admin publica — dá para demonstrar o force
 * update localmente sem polling. Entre usuários reais diferentes, quem
 * sincroniza é o backend.
 */
export const MOCK_EPOCH_KEY = 'mock_server_epoch';

const MOCK_LATENCY_MS = 150;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function readMockEpoch() {
  try {
    return normalizeEpoch(JSON.parse(localStorage.getItem(MOCK_EPOCH_KEY)));
  } catch {
    return FIRST_EPOCH;
  }
}

export async function getSystemState() {
  await delay(MOCK_LATENCY_MS);
  return { epoch: readMockEpoch() };
}

export async function bumpServerVersion() {
  await delay(MOCK_LATENCY_MS);
  const epoch = readMockEpoch() + 1;
  localStorage.setItem(MOCK_EPOCH_KEY, JSON.stringify(epoch));
  return { epoch };
}
