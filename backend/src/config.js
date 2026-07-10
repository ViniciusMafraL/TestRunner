export const config = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  issuesGid: Number(process.env.GOOGLE_SHEET_GID),
  testRunGid: Number(process.env.GOOGLE_TEST_RUN_GID),
  driveEvidenceFolderId: process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID,
  googleClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  usersSheetId: process.env.GOOGLE_USERS_SHEET_ID,
  // A planilha de usuários é a planilha de controle (abas Users/Operations/Projects).
  controlSheetId: process.env.GOOGLE_USERS_SHEET_ID,
  sessionSecret: process.env.SESSION_SECRET,
  // Domínio do Workspace (opcional): se definido, só contas dele logam.
  allowedDomain: process.env.GOOGLE_ALLOWED_DOMAIN,
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : '*',
};
