import { google } from 'googleapis';

// Script de diagnóstico: confirma que a Service Account consegue enxergar a
// planilha (credenciais válidas + planilha compartilhada com o e-mail certo)
// sem escrever nada nela. Não é parte do backend real ainda — só validação
// manual do setup de credenciais (ver conversa/README sobre Google Sheets API).

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const targetGid = process.env.GOOGLE_SHEET_GID ? Number(process.env.GOOGLE_SHEET_GID) : null;

if (!spreadsheetId) {
  console.error('GOOGLE_SHEET_ID não definido. Configure backend/.env (ver .env.example).');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

try {
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'properties.title,sheets.properties',
  });

  console.log(`Conectado com sucesso à planilha: "${data.properties.title}"`);
  console.log('Abas encontradas:');
  for (const sheet of data.sheets) {
    const marker = sheet.properties.sheetId === targetGid ? '  <- GOOGLE_SHEET_GID configurado' : '';
    console.log(`  - "${sheet.properties.title}" (gid=${sheet.properties.sheetId})${marker}`);
  }

  const target = targetGid !== null ? data.sheets.find((sheet) => sheet.properties.sheetId === targetGid) : data.sheets[0];

  if (!target) {
    console.warn(`Nenhuma aba encontrada com gid=${targetGid}. Confira GOOGLE_SHEET_GID em backend/.env.`);
    process.exit(1);
  }

  const range = `'${target.properties.title}'!A1:N5`;
  const { data: values } = await sheets.spreadsheets.values.get({ spreadsheetId, range });

  console.log(`\nPrimeiras linhas da aba "${target.properties.title}":`);
  console.table(values.values ?? []);

  const expectedHeader = [
    'ID',
    'Status',
    'Severity',
    'Tag',
    'Title',
    'Description',
    'Attachment',
    'Found By',
    'Version',
    'Platform',
    'Key words',
    'Store',
    'Created in',
  ];
  const actualHeader = values.values?.[0] ?? [];
  const headerMatches = expectedHeader.every((column, index) => actualHeader[index] === column);

  console.log('\nCabeçalho completo encontrado:', actualHeader);

  if (headerMatches) {
    console.log('✅ Cabeçalho da planilha bate exatamente com o schema esperado.');
  } else {
    console.warn('⚠️  Cabeçalho da planilha é diferente do esperado. Esperado:', expectedHeader);
    console.warn('   Encontrado:', actualHeader);
  }
} catch (error) {
  console.error('\n❌ Falha ao acessar a planilha.');
  if (error.code === 403 || error.message?.includes('PERMISSION_DENIED')) {
    console.error('   Provável causa: a planilha ainda não foi compartilhada com o e-mail da Service Account, ou foi compartilhada apenas como leitor.');
  } else if (error.code === 404) {
    console.error('   Provável causa: GOOGLE_SHEET_ID incorreto.');
  }
  console.error('   Detalhe:', error.message);
  process.exit(1);
}
