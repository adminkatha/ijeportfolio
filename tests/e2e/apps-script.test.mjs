// Runs docs/contact/apps-script.gs against mocked Apps Script services (no Google account needed).
//   node tests/e2e/apps-script.test.mjs

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../../docs/contact/apps-script.gs", import.meta.url), "utf8");
const SECRET = "a-long-shared-secret-for-tests";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${ok || !detail ? "" : `\n      ${detail}`}`);
};

function mockSheet(name, rows = []) {
  const sheet = {
    name,
    rows,
    frozen: 0,
    getName: () => sheet.name,
    setName: (n) => ((sheet.name = n), sheet),
    getLastRow: () => sheet.rows.length,
    getLastColumn: () => Math.max(0, ...sheet.rows.map((r) => r.length)),
    appendRow: (row) => sheet.rows.push(row),
    setFrozenRows: (n) => (sheet.frozen = n),
    getRange: (row, col, numRows, numCols) => {
      if (typeof row === "string") return { setNumberFormat: () => {} };
      return {
        getValues: () => [Array.from({ length: numCols }, (_, i) => sheet.rows[row - 1]?.[col - 1 + i] ?? "")],
        setValues: (values) => {
          sheet.rows[row - 1] = values[0].slice();
          return { setFontWeight: () => {} };
        },
      };
    },
  };
  return sheet;
}

function load({ secret = SECRET, sheets = [mockSheet("Sheet1")], mailThrows = false } = {}) {
  const sent = [];
  const logs = [];
  const spreadsheet = {
    getSheetByName: (n) => sheets.find((s) => s.name === n) ?? null,
    getSheets: () => sheets,
    insertSheet: (n) => {
      const s = mockSheet(n);
      sheets.push(s);
      return s;
    },
    getUrl: () => "https://sheet.invalid/current",
  };
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === "CONTACT_SECRET" ? secret : null) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush: () => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
    },
    MailApp: {
      sendEmail: (options) => {
        if (mailThrows) throw new Error("quota");
        sent.push(options);
      },
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: "sha256" },
      Charset: { UTF_8: "utf8" },
      // Apps Script returns signed bytes (-128…127)
      computeDigest: (_alg, value) => [...createHash("sha256").update(value, "utf8").digest()].map((b) => (b > 127 ? b - 256 : b)),
      formatDate: (date) => date.toISOString(),
    },
    Session: { getScriptTimeZone: () => "Etc/UTC" },
    console: { log: (...a) => logs.push(a.join(" ")), error: (...a) => logs.push(a.join(" ")) },
  };
  vm.createContext(context);
  vm.runInContext(SOURCE, context);
  const post = (body) => JSON.parse(context.doPost({ postData: { contents: typeof body === "string" ? body : JSON.stringify(body) } }).text);
  return { context, sheets, sent, logs, post };
}

const valid = {
  secret: SECRET,
  timestamp: "2026-10-06T01:02:03.000Z",
  name: "Test\u0000 Visitor",
  email: "visitor@example.com",
  company: "=HYPERLINK(\"https://example.com\")",
  inquiryType: "Freelance project",
  message: "+ first line\r\n@second line\u202e",
  page: "/work/sabbath-spa",
};

console.log("Apps Script (mocked services):");
{
  const { post, sheets, sent } = load();
  check("wrong secret → unauthorized, nothing written", post({ ...valid, secret: "nope" }).error === "unauthorized" && sheets[0].rows.length === 0 && sent.length === 0);
  check("bad JSON → bad_request", post("{oops").error === "bad_request");
  check("invalid email → invalid", post({ ...valid, email: "not-an-email" }).error === "invalid" && sheets[0].rows.length === 0);
  check("missing message → invalid", post({ ...valid, message: "   " }).error === "invalid");

  const res = post(valid);
  const sheet = sheets[0];
  check("valid → {ok:true}", res.ok === true, JSON.stringify(res));
  check("an empty first tab becomes “Submissions”", sheet.name === "Submissions" && sheets.length === 1, sheet.name);
  check("header row added", sheet.rows[0]?.join("|") === "Timestamp|Name|Email|Company|Inquiry type|Message|Page", JSON.stringify(sheet.rows[0]));
  const row = sheet.rows[1] ?? [];
  check("timestamp is a Date from the payload", row[0] instanceof Date || Object.prototype.toString.call(row[0]) === "[object Date]");
  check("control characters stripped", row[1] === "Test Visitor" && row[5] === "'+ first line\n@second line", JSON.stringify(row));
  check("formula-like values escaped with an apostrophe", row[3] === "'=HYPERLINK(\"https://example.com\")" && row[5].startsWith("'+"), JSON.stringify(row));
  check("inquiry type and page kept", row[4] === "Freelance project" && row[6] === "/work/sabbath-spa");
  check("notification sent to Ehjay with reply-to = visitor", sent.length === 1 && sent[0].to === "ehjaylorenzo2@gmail.com" && sent[0].replyTo === "visitor@example.com", JSON.stringify(sent[0]));
  check("notification has no line breaks in the subject", !/[\r\n]/.test(sent[0]?.subject ?? "x"));

  post({ ...valid, name: "Second", company: "-5", email: "second@example.com", message: "@hello there" });
  check("second message: header not repeated, row appended", sheet.rows.length === 3 && sheet.rows[2][1] === "Second" && sheet.rows[2][3] === "'-5");
  check("doGet answers post_only", JSON.parse(load().context.doGet().text).error === "post_only");
}
{
  const existing = mockSheet("Leads", [["Something", "else"]]);
  const { post, sheets } = load({ sheets: [existing] });
  post(valid);
  check("a non-empty first tab is left alone; a Submissions tab is added", existing.rows.length === 1 && sheets[1]?.name === "Submissions" && sheets[1].rows.length === 2);
}
{
  const { post, sheets, logs } = load({ mailThrows: true });
  const res = post(valid);
  check("mail failure still saves the row and answers ok", res.ok === true && sheets[0].rows.length === 2);
  check("logs never contain the message or the secret", logs.every((l) => !l.includes("second line") && !l.includes(SECRET)), logs.join(" | "));
}
{
  check("no CONTACT_SECRET property → not_configured", load({ secret: null }).post(valid).error === "not_configured");
  check("short CONTACT_SECRET property → not_configured", load({ secret: "short" }).post({ ...valid, secret: "short" }).error === "not_configured");
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed.`);
process.exit(failed ? 1 : 0);
