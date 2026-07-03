import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetStore } from '../src/api/mock/store.js';

afterEach(() => {
  resetStore();
  localStorage.clear();
});
