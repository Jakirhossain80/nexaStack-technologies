import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { escapeCsvField, neutralizeFormula, toCsv, UTF8_BOM } from './csv.js';

/** A minimal RFC 4180 reader, used to prove `toCsv` output round-trips to the original values. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r' && text[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
    } else field += c;
  }
  return rows;
}

describe('escapeCsvField: structure', () => {
  it('leaves a plain value unquoted', () => {
    assert.equal(escapeCsvField('Hello world'), 'Hello world');
  });

  it('quotes a value containing a comma', () => {
    assert.equal(escapeCsvField('Acme, Inc.'), '"Acme, Inc."');
  });

  it('quotes a value containing a double quote and doubles it', () => {
    assert.equal(escapeCsvField('She said "hi"'), '"She said ""hi"""');
  });

  it('quotes a value containing a newline (LF and CRLF)', () => {
    assert.equal(escapeCsvField('line1\nline2'), '"line1\nline2"');
    assert.equal(escapeCsvField('line1\r\nline2'), '"line1\r\nline2"');
  });

  it('handles all hazards at once', () => {
    assert.equal(escapeCsvField('a, "b"\nc'), '"a, ""b""\nc"');
  });

  it('keeps an empty string empty', () => {
    assert.equal(escapeCsvField(''), '');
  });

  it('preserves non-Latin text', () => {
    assert.equal(escapeCsvField('জাকির হোসেন'), 'জাকির হোসেন');
  });
});

describe('neutralizeFormula: formula injection', () => {
  const dangerous = [
    '=1+1',
    '=HYPERLINK("http://evil.example","x")',
    "+cmd|' /C calc'!A0",
    '-2+3',
    '@SUM(A1:A9)',
    '\t=1+1',
    '\r=1+1',
    "=cmd|' /C calc'!A0",
    '-',
    '+',
  ];
  for (const value of dangerous) {
    it(`prefixes ${JSON.stringify(value)}`, () => {
      assert.equal(neutralizeFormula(value), `'${value}`);
    });
  }

  const safe = [
    '+880 1712-119253',
    '+8801712119253',
    '-5',
    '(880) 1712-119253',
    '01712-119253',
    'hello',
    'a=b',
    'email@example.com',
    ' =leading space',
    '',
  ];
  for (const value of safe) {
    it(`leaves ${JSON.stringify(value)} alone`, () => {
      assert.equal(neutralizeFormula(value), value);
    });
  }

  it('applies before quoting, so the quote character is inside the quoted field', () => {
    assert.equal(escapeCsvField('=A1, B1'), '"\'=A1, B1"');
  });
});

describe('toCsv', () => {
  it('starts with a UTF-8 BOM, ends with CRLF and joins rows with CRLF', () => {
    const csv = toCsv(['a', 'b'], [['1', '2']]);
    assert.equal(csv, `${UTF8_BOM}a,b\r\n1,2\r\n`);
  });

  it('round-trips awkward values exactly (comma, quote, newline, unicode)', () => {
    const rows = [
      ['Md. Jakir, Hossain', 'She said "hello"', 'line 1\nline 2', 'জাকির'],
      ['', 'x', '', 'y'],
    ];
    const parsed = parseCsv(toCsv(['n', 'q', 'm', 'u'], rows).slice(1));
    assert.deepEqual(parsed, [['n', 'q', 'm', 'u'], ...rows]);
  });

  it('a hostile message cannot break out of its own cell or start a formula', () => {
    const hostile = '=HYPERLINK("http://evil.example","click")\r\n,injected,column';
    const parsed = parseCsv(toCsv(['message'], [[hostile]]).slice(1));
    assert.equal(parsed.length, 2, 'one header row and one data row');
    assert.equal(parsed[1]?.length, 1, 'still exactly one cell');
    assert.ok(parsed[1]?.[0]?.startsWith("'="), 'formula neutralised');
  });
});
