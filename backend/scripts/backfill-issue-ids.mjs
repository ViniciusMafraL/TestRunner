import { google } from 'googleapis';

// Preenche a coluna ID de qualquer linha existente na aba de issues que ainda
// esteja em branco, sem tocar em IDs já preenchidos. Rodar uma única vez
// (idempotente: rodar de novo não duplica nem reatribui IDs já existentes).

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const gid = Number(process.env.GOOGLE_SHEET_GID);

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const { data: meta } = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
const sheet = meta.sheets.find((entry) => entry.properties.sheetId === gid);
if (!sheet) {
  console.error(`Aba com gid=${gid} não encontrada.`);
  process.exit(1);
}
const tabName = sheet.properties.title;

// Lê ID (A) e Status (B) para saber quais linhas têm dado real.
const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${tabName}'!A2:B` });
const rows = data.values ?? [];

let maxExistingSeq = 0;
for (const [id] of rows) {
  const match = id?.match(/^BUG-(\d+)$/);
  if (match) maxExistingSeq = Math.max(maxExistingSeq, Number(match[1]));
}

const updatedIds = [];
let nextSeq = maxExistingSeq + 1;
let filledCount = 0;

rows.forEach(([id, status], index) => {
  const hasData = Boolean(status && status.trim());
  if (!hasData) {
    updatedIds.push([id ?? '']);
    return;
  }
  if (id && id.trim()) {
    updatedIds.push([id]);
    return;
  }
  const newId = `BUG-${String(nextSeq).padStart(3, '0')}`;
  nextSeq += 1;
  filledCount += 1;
  updatedIds.push([newId]);
});

if (filledCount === 0) {
  console.log('Nenhuma linha com ID em branco encontrada — nada para fazer.');
  process.exit(0);
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `'${tabName}'!A2:A${rows.length + 1}`,
  valueInputOption: 'RAW',
  requestBody: { values: updatedIds },
});

console.log(`✅ ${filledCount} linha(s) receberam um novo ID (de BUG-${String(maxExistingSeq + 1).padStart(3, '0')} até BUG-${String(nextSeq - 1).padStart(3, '0')}) na aba "${tabName}".`);
