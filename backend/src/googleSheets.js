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

export async function getTabTitle(gid) {
  if (tabTitleCache.has(gid)) return tabTitleCache.get(gid);
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
    fields: 'sheets.properties',
  });
  const sheet = data.sheets.find((entry) => entry.properties.sheetId === gid);
  if (!sheet) throw new Error(`Aba com gid=${gid} não encontrada na planilha`);
  tabTitleCache.set(gid, sheet.properties.title);
  return sheet.properties.title;
}

export async function readRange(gid, a1Range) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid);
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${title}'!${a1Range}`,
  });
  return data.values ?? [];
}

export async function appendRow(gid, rowValues) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid);
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
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

export async function updateRow(gid, rowNumber, rowValues) {
  const sheets = getSheetsClient();
  const title = await getTabTitle(gid);
  const lastColumn = columnLetter(rowValues.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `'${title}'!A${rowNumber}:${lastColumn}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowValues] },
  });
}
