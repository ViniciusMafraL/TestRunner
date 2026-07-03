import { google } from 'googleapis';

// Cria a aba "Test Run" na planilha real (se ainda não existir) com o
// cabeçalho esperado pelo contrato de Demanda de Test Run
// (specs/001-qa-bug-tracker/data-model.md). Idempotente: se a aba já existir,
// não faz nada.

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const TAB_NAME = 'Test Run';
const HEADER = ['ID', 'Build', 'Version', 'Test Type', 'Responsible', 'Platform', 'Status'];

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const { data: meta } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
const existing = meta.sheets.find((sheet) => sheet.properties.title === TAB_NAME);

if (existing) {
  console.log(`A aba "${TAB_NAME}" já existe (gid=${existing.properties.sheetId}). Nada para fazer.`);
  process.exit(0);
}

const { data: addResult } = await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [{ addSheet: { properties: { title: TAB_NAME } } }],
  },
});

const newSheetId = addResult.replies[0].addSheet.properties.sheetId;

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `'${TAB_NAME}'!A1:G1`,
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] },
});

console.log(`✅ Aba "${TAB_NAME}" criada (gid=${newSheetId}) com o cabeçalho: ${HEADER.join(', ')}`);
console.log(`   Adicione GOOGLE_TEST_RUN_GID=${newSheetId} ao backend/.env`);
