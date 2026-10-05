/**
 * Contact form → this Google Sheet (Ehjay Lorenzo's portfolio).
 *
 * Paste this file into the sheet's own Apps Script project (in the sheet: Extensions → Apps Script), so the
 * script is bound to the sheet: it writes with SpreadsheetApp.getActiveSpreadsheet() and never needs the
 * sheet's ID or URL. Step-by-step setup: docs/CONTACT-SETUP.md in the website's repository.
 *
 * Needs one script property (Project Settings → Script properties):
 *   CONTACT_SECRET   the same long random value as the website's CONTACT_SECRET variable.
 *
 * What it does with each POST from the website:
 *   1. parses the JSON body and checks the shared secret (constant-time comparison);
 *   2. validates and length-limits every field and strips control characters;
 *   3. escapes any value that starts with = + - @ so the sheet never runs it as a formula;
 *   4. adds the header row if it's missing, then appends the row (one at a time, with a lock);
 *   5. emails a short notification (reply-to = the visitor's address);
 *   6. answers {"ok":true} or {"ok":false,"error":"…"}.
 * It never logs what a visitor wrote, and the website never logs the secret.
 *
 * @OnlyCurrentDoc
 */

const NOTIFY_EMAIL = 'ehjaylorenzo2@gmail.com';
/** The tab the rows go into. Created on the first message (an empty first tab is renamed instead). */
const SHEET_NAME = 'Submissions';
const HEADERS = ['Timestamp', 'Name', 'Email', 'Company', 'Inquiry type', 'Message', 'Page'];
const LIMITS = { name: 100, email: 254, company: 120, inquiryType: 40, message: 5000, page: 200 };
const MIN_SECRET_LENGTH = 16;
const MAX_BODY_LENGTH = 30000;
const EMAIL_PATTERN = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;
// C0/C1 control characters and the bidi override/isolate controls.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u202A-\u202E\u2066-\u2069]/g;

/** The website posts here. */
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_BODY_LENGTH) return reply_({ ok: false, error: 'bad_request' });

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      return reply_({ ok: false, error: 'bad_request' });
    }
    if (!body || typeof body !== 'object') return reply_({ ok: false, error: 'bad_request' });

    const secret = PropertiesService.getScriptProperties().getProperty('CONTACT_SECRET');
    if (!secret || secret.length < MIN_SECRET_LENGTH) return reply_({ ok: false, error: 'not_configured' });
    if (typeof body.secret !== 'string' || !sameSecret_(body.secret, secret)) {
      return reply_({ ok: false, error: 'unauthorized' });
    }

    const entry = cleanEntry_(body);
    if (!entry) return reply_({ ok: false, error: 'invalid' });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return reply_({ ok: false, error: 'busy' });
    try {
      const sheet = getSheet_();
      ensureHeader_(sheet);
      sheet.appendRow(
        [entry.timestamp, entry.name, entry.email, entry.company, entry.inquiryType, entry.message, entry.page].map(safeCell_)
      );
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    notify_(entry); // the row is saved first; a mail problem doesn't lose the message
    return reply_({ ok: true });
  } catch (err) {
    console.error('doPost failed: ' + (err && err.name ? err.name : 'error')); // no form contents in the log
    return reply_({ ok: false, error: 'server_error' });
  }
}

/** Opening the web app URL in a browser shows this: it proves the deployment is live. */
function doGet() {
  return reply_({ ok: false, error: 'post_only' });
}

/**
 * Optional: run this once from the editor (choose checkSetup → Run). It asks for permission, checks the
 * secret is set (without showing it) and creates the Submissions tab with its header row.
 */
function checkSetup() {
  const secret = PropertiesService.getScriptProperties().getProperty('CONTACT_SECRET');
  if (!secret) throw new Error('Add the script property CONTACT_SECRET (Project Settings → Script properties).');
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error('CONTACT_SECRET is too short: use at least ' + MIN_SECRET_LENGTH + ' characters.');
  }
  const sheet = getSheet_();
  ensureHeader_(sheet);
  console.log('Setup OK. The secret is set (' + secret.length + ' characters) and rows go to the "' + sheet.getName() + '" tab.');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────

function reply_(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/** Constant-time comparison: compares SHA-256 digests byte by byte, so timing reveals nothing about the secret. */
function sameSecret_(given, expected) {
  const a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, given, Utilities.Charset.UTF_8);
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, expected, Utilities.Charset.UTF_8);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** One line of text: no line breaks or control characters, single spaces, at most `max` characters. */
function line_(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\r\n\t\u2028\u2029]+/g, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, max);
}

/** Multi-line text: line breaks and tabs kept, control characters removed, at most `max` characters. */
function text_(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?|[\u2028\u2029]/g, '\n')
    .replace(CONTROL_CHARS, '')
    .trim()
    .slice(0, max);
}

/** The validated row, or null when a required field is missing or the email address isn't valid. */
function cleanEntry_(body) {
  const entry = {
    name: line_(body.name, LIMITS.name),
    email: line_(body.email, LIMITS.email),
    company: line_(body.company, LIMITS.company),
    inquiryType: line_(body.inquiryType, LIMITS.inquiryType) || 'Other',
    message: text_(body.message, LIMITS.message),
    page: line_(body.page, LIMITS.page),
  };
  if (!entry.name || !entry.message || !EMAIL_PATTERN.test(entry.email)) return null;
  if (entry.page && entry.page.charAt(0) !== '/') entry.page = '';
  const time = new Date(typeof body.timestamp === 'string' ? body.timestamp : '');
  entry.timestamp = isNaN(time.getTime()) ? new Date() : time;
  return entry;
}

/** Text that starts with = + - @ would run as a formula: prefix it with an apostrophe so it stays text. */
function safeCell_(value) {
  return typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : value;
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const existing = spreadsheet.getSheetByName(SHEET_NAME);
  if (existing) return existing;
  const sheets = spreadsheet.getSheets();
  if (sheets.length === 1 && sheets[0].getLastRow() === 0 && sheets[0].getLastColumn() === 0) {
    return sheets[0].setName(SHEET_NAME); // a brand-new, empty sheet: use its only tab
  }
  return spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeader_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isEmpty = firstRow.every(function (cell) {
    return cell === '' || cell === null;
  });
  if (!isEmpty) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');
}

function notify_(entry) {
  try {
    const zone = Session.getScriptTimeZone();
    const lines = [
      'New message from the contact form on your portfolio.',
      '',
      'Name: ' + entry.name,
      'Email: ' + entry.email,
      'Company: ' + (entry.company || '-'),
      'Inquiry type: ' + entry.inquiryType,
      'Page: ' + (entry.page || '-'),
      'Received: ' + Utilities.formatDate(entry.timestamp, zone, 'yyyy-MM-dd HH:mm') + ' (' + zone + ')',
      '',
      entry.message,
      '',
      '--',
      'Reply to this email to answer ' + entry.name + ' directly.',
      'Every message is also in the "' + SHEET_NAME + '" tab: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    ];
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: entry.email,
      name: 'Portfolio contact form',
      subject: ('Portfolio enquiry: ' + entry.inquiryType + ' from ' + entry.name).slice(0, 200),
      body: lines.join('\n'),
    });
  } catch (err) {
    console.error('Notification email failed: ' + (err && err.name ? err.name : 'error'));
  }
}
