/**
 * Minimal, dependency-free CSV writer (RFC 4180) for admin exports.
 *
 * Two hazards a naive `join(',')` gets wrong:
 *
 * 1. STRUCTURE. A field containing a comma, a double quote, a CR or an LF must be wrapped in double
 *    quotes, with every embedded double quote doubled. Enquiry messages are free text and contain
 *    all of these.
 * 2. FORMULA INJECTION. A spreadsheet treats a cell that starts with `=`, `+`, `-` or `@` (and, for
 *    some parsers, a tab or CR) as a formula. An enquiry is written by an anonymous member of the
 *    public, so a message of `=HYPERLINK(...)` or `@SUM(...)` would execute when the admin opens
 *    the export. Such cells are prefixed with a single quote, which spreadsheets treat as "this is
 *    text". The one exception is a plain phone number or numeric value (`+880 1712-119253`,
 *    `-5`): it cannot carry a function call, and prefixing it would corrupt real data.
 */

/** UTF-8 byte-order mark: without it, Excel opens a UTF-8 CSV as ANSI and garbles non-Latin
 * names (Bangla). Harmless to every other reader. */
export const UTF8_BOM = '﻿';

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
/** Digits, spaces, dots, parentheses and hyphens after an optional sign and a leading digit. */
const PLAIN_NUMBER = /^[+-]?\d[\d\s().-]*$/;

/** Neutralise a cell a spreadsheet would otherwise execute. Exported for tests. */
export function neutralizeFormula(value: string): string {
  if (FORMULA_TRIGGER.test(value) && !PLAIN_NUMBER.test(value)) return `'${value}`;
  return value;
}

/** One RFC 4180 field, with the formula guard applied first. */
export function escapeCsvField(value: string): string {
  const safe = neutralizeFormula(value);
  if (/[",\r\n]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

/** A whole CSV document: BOM, a header row and data rows, CRLF-terminated (RFC 4180). */
export function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCsvField).join(','));
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`;
}
