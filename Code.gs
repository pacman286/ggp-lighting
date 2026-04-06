/**
 * GGP Lighting Assessment Tool — Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Open your Google Sheet.
 * 2. Click Extensions → Apps Script.
 * 3. Delete any existing code and paste this entire file.
 * 4. Save the project (name it anything, e.g. "GGP Lighting API").
 * 5. Click Deploy → New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Click Deploy. Authorise the script when prompted.
 * 7. Copy the Web app URL shown after deployment.
 * 8. Paste that URL into the SHEETS_URL constant in index.html.
 *
 * REDEPLOYMENT (after code changes)
 * ──────────────────────────────────
 * Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.
 * The URL stays the same.
 */

// Name of the sheet tab that stores assessment records.
const SHEET_NAME = 'Assessment Log';

// Column order — must match what the app sends.
const COLS = [
  'assessedAt',
  'assessedBy',
  'poleTagId',
  'deviceNum',
  'poleType',
  'locationId',
  'fixturePosition',
  'fixtureLabel',
  'fixtureZone',
  'fixtureManufacturer',
  'fixtureModel',
  'conditionValue',
  'conditionLabel',
  'notes'
];

// ── GET: handles both loading all records and saving a new one ───────────────
// Using GET for everything avoids CORS preflight issues with Apps Script.

function doGet(e) {
  try {
    const action = e.parameter.action || 'load';

    if (action === 'save') {
      // Decode and append the record passed as a URL parameter
      const record = JSON.parse(e.parameter.data);
      const sheet  = getOrCreateSheet();
      const row    = COLS.map(col => record[col] ?? '');
      sheet.appendRow(row);
      return jsonResponse({ status: 'ok' });
    }

    // Default: load all records
    const sheet   = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return jsonResponse({ status: 'ok', records: [] });
    }

    const values  = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();
    const records = values.map(row => {
      const obj = {};
      COLS.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    return jsonResponse({ status: 'ok', records });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// doPost kept as a no-op fallback
function doPost(e) {
  return jsonResponse({ status: 'error', message: 'Use GET requests only.' });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLS);
    // Basic formatting: freeze header row, bold it
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
  } else if (sheet.getLastRow() === 0) {
    // Sheet exists but is empty — write headers
    sheet.appendRow(COLS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
