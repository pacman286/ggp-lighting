/**
 * GGP Lighting Assessment Tool — Google Apps Script Backend
 * Version 1.4.0
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Open your Google Sheet.
 * 2. Click Extensions → Apps Script.
 * 3. Delete any existing code and paste this entire file.
 * 4. Save the project.
 * 5. Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.
 *    (The web app URL stays the same.)
 *
 * IMPORTANT — FIRST RUN AFTER UPGRADING
 * ──────────────────────────────────────
 * This version adds an "idx" column as the first column of the sheet.
 * Before your next assessment round, DELETE the entire "Assessment Log" tab.
 * The script will recreate it with the correct headers on the first save.
 * (If you keep an old tab, records will still load but will fall back to
 * timestamp ordering, which is less reliable across multiple devices.)
 */

const SHEET_NAME = 'Assessment Log';

// Fields supplied by the app, in order.
const RECORD_COLS = [
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

// Full sheet layout — 'idx' is assigned server-side and always comes first.
const SHEET_COLS = ['idx'].concat(RECORD_COLS);

// How long a save will wait for the lock before giving up (milliseconds).
const LOCK_TIMEOUT_MS = 30000;

// ── GET: handles both loading all records and saving a new one ───────────────
// Using GET for everything avoids CORS preflight issues with Apps Script.

function doGet(e) {
  try {
    const action = e.parameter.action || 'load';
    return (action === 'save') ? handleSave(e) : handleLoad();
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ── Save ────────────────────────────────────────────────────────────────────

function handleSave(e) {
  if (!e.parameter.data) {
    return jsonResponse({ status: 'error', message: 'No data parameter supplied.' });
  }

  const record = JSON.parse(e.parameter.data);

  // Serialise concurrent writes. Multiple field teams saving at the same
  // moment would otherwise be able to resolve the same append target.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Server busy — could not acquire write lock. Please retry.'
    });
  }

  try {
    const sheet   = getOrCreateSheet();
    const lastRow = sheet.getLastRow();

    // Index is monotonic and assigned here, by the single authoritative
    // source, so device clock differences cannot affect record ordering.
    const nextIdx = (lastRow <= 1) ? 1 : (Number(sheet.getRange(lastRow, 1).getValue()) || lastRow - 1) + 1;

    const row = [nextIdx].concat(RECORD_COLS.map(function (col) {
      return (record[col] === undefined || record[col] === null) ? '' : record[col];
    }));

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return jsonResponse({ status: 'ok', idx: nextIdx });

  } finally {
    lock.releaseLock();
  }
}

// ── Load ────────────────────────────────────────────────────────────────────

function handleLoad() {
  const sheet   = getOrCreateSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return jsonResponse({ status: 'ok', records: [] });
  }

  // Read the header row so we can handle both the current layout and any
  // older sheet that predates the idx column.
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
                       .getValues()[0]
                       .map(function (h) { return String(h).trim(); });

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  const records = values.map(function (row) {
    const obj = {};
    headers.forEach(function (col, i) {
      if (col) obj[col] = row[i];
    });
    return obj;
  });

  return jsonResponse({ status: 'ok', records: records });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    writeHeaders(sheet);
  } else if (sheet.getLastRow() === 0) {
    writeHeaders(sheet);
  }

  return sheet;
}

function writeHeaders(sheet) {
  sheet.appendRow(SHEET_COLS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, SHEET_COLS.length).setFontWeight('bold');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
