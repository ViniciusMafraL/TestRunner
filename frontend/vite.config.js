import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['tests/unit/**/*.test.{js,jsx}', 'tests/component/**/*.test.{js,jsx}', 'tests/contract/**/*.test.{js,jsx}'],
  },
});
