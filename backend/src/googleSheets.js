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

export async function readRange(gid, a1Range, spreadsheetId = config.spreadsheetId) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid, spreadsheetId);
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${title}'!${a1Range}`,
  });
  return data.values ?? [];
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
