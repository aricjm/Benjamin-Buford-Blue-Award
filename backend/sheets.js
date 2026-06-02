// sheets.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
const sheetId = process.env.SHEET_ID;

if (!keyFile || !sheetId) {
  console.warn('GOOGLE_SERVICE_ACCOUNT_KEY_PATH or SHEET_ID not set in env');
}

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function readRange(range) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

async function appendRow(sheetName, row) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

async function updateRange(range, values) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

module.exports = { readRange, appendRow, updateRange };
