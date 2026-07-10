import { google } from 'googleapis';
import { config } from './config.js';

let sheetsClient;

function getSheetsClient() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

const tabTitleCache = new Map();

// Todas as funções aceitam um spreadsheetId opcional (padrão: a planilha de
// issues/test runs). A planilha separada de usuários (GOOGLE_USERS_SHEET_ID)
// usa as mesmas primitivas passando o id dela.
export async function getTabTitle(gid, spreadsheetId = config.spreadsheetId) {
  const cacheKey = `${spreadsheetId}:${gid}`;
  if (tabTitleCache.has(cacheKey)) return tabTitleCache.get(cacheKey);
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });
  const sheet = data.sheets.find((entry) => entry.properties.sheetId === gid);
  if (!sheet) throw new Error(`Aba com gid=${gid} não encontrada na planilha ${spreadsheetId}`);
  tabTitleCache.set(cacheKey, sheet.properties.title);
  return sheet.properties.title;
}

// Lista as abas (páginas) de uma planilha: [{ title, gid }]. Base da
// auto-detecção de projetos (cada aba, exceto a de Test Run, é um projeto).
export async function listTabs(spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  return (data.sheets ?? []).map((entry) => ({ title: entry.properties.title, gid: entry.properties.sheetId }));
}

// Cria uma aba nova (projeto) e escreve o cabeçalho na linha 1. Retorna { title, gid }.
export async function addTab(spreadsheetId, title, headerRow) {
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  const gid = data.replies?.[0]?.addSheet?.properties?.sheetId;
  if (headerRow?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${title}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headerRow] },
    });
  }
  return { title, gid };
}

export async function readRange(gid, a1Range, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid, spreadsheetId);
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title}'!${a1Range}`,
  });
  return data.values ?? [];
}

// Variantes por título de aba (para as abas de controle Operations/Projects,
// cujos gids não vivem no .env — o título é padrão e conhecido).
export async function readRangeByTitle(title, a1Range, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${title}'!${a1Range}` });
  return data.values ?? [];
}

export async function appendRowByTitle(title, rowValues, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${title}'!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] },
  });
}

export async function appendRow(gid, rowValues, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid, spreadsheetId);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${title}'!A:A`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] },
  });
}

function columnLetter(count) {
  let letter = '';
  let n = count;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

export async function updateRow(gid, rowNumber, rowValues, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid, spreadsheetId);
  const lastColumn = columnLetter(rowValues.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${title}'!A${rowNumber}:${lastColumn}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowValues] },
  });
}
