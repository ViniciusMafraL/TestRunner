import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App.jsx';
import './styles/tokens.css';

/* Tema inicial antes do primeiro render: preferência salva > preferência do sistema. */
const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
document.documentElement.dataset.theme =
  storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : prefersDark ? 'dark' : 'light';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
