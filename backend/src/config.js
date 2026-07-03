export const config = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  issuesGid: Number(process.env.GOOGLE_SHEET_GID),
  testRunGid: Number(process.env.GOOGLE_TEST_RUN_GID),
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
