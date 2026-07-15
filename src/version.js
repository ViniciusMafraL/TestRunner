/* global __APP_VERSION__, __BUILD_TIME__ */
// Constantes injetadas no build pelo Vite (ver vite.config.js `define`).
// APP_VERSION = semver do package.json; BUILD_TIME = data/hora do build (pt-BR),
// que muda a cada `npm run build`/deploy. Fallbacks para o ambiente de teste,
// onde o define pode não estar presente.
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
