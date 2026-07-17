import { createApp } from './app.js';
import { config } from './config.js';
import { loadEpoch } from './systemState.js';

// A época precisa ser restaurada antes de aceitar requisições: só assim as
// sessões emitidas antes de um restart continuam sendo julgadas corretamente.
const epoch = loadEpoch();

const app = createApp();
app.listen(config.port, () => {
  console.log(`Backend rodando em http://localhost:${config.port} (época de sessão: ${epoch})`);
});
