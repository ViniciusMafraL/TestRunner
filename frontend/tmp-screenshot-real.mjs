import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const outDir = 'C:/Users/viiny/AppData/Local/Temp/claude/c--Code-ProjetoHermit-TestRunner/37f5e3e2-d71b-4ecb-88bb-3e1329a5994e/scratchpad';

page.on('pageerror', (err) => console.log('[pageerror]', err.message));

await page.goto('http://localhost:5173/login');
await page.getByRole('button', { name: 'Entrar', exact: true }).click();
await page.waitForURL(/\/home/, { timeout: 10000 });
await page.getByText('Abertas', { exact: true }).waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/real-home.png` });

await page.getByRole('link', { name: 'Issue Tracker' }).click();
await page.getByRole('button', { name: /Fixed/ }).waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/real-issue-tracker.png` });

await page.getByRole('link', { name: 'Reporter' }).click();
await page.getByLabel(/Title/).waitFor({ timeout: 10000 });
await page.getByLabel(/Title/).fill('[TESTE VIA UI - pode apagar]');
await page.getByLabel(/Version/).fill('9.9.9');
await page.getByRole('button', { name: 'Enviar' }).click();
await page.getByText(/criada com status/).waitFor({ timeout: 20000 });
await page.screenshot({ path: `${outDir}/real-reporter.png` });

await browser.close();
console.log('done');
