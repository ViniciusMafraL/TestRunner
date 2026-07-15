import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Versão da ferramenta: o semver vem do package.json (bump manual a cada release)
// e a data/hora do build é gerada a cada `npm run build` (portanto muda a cada
// deploy) — serve de confirmação visual de que o deploy novo entrou no ar.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const buildTime = new Date().toLocaleString('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default defineConfig({
  base: '/TestRunner/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['tests/unit/**/*.test.{js,jsx}', 'tests/component/**/*.test.{js,jsx}', 'tests/contract/**/*.test.{js,jsx}'],
  },
});
