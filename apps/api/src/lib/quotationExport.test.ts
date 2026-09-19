import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UTF8_BOM } from './csv.js';
import { QUOTATION_CSV_HEADER, buildQuotationCsv, type QuotationCsvRow } from './quotationExport.js';

const BASE: QuotationCsvRow = {
  referenceNumber: 'NXQ-1A2B3C4D',
  createdAt: new Date('2026-09-19T08:30:00.000Z'),
  status: 'reviewing',
  archived: false,
  fullName: 'Rahim Uddin',
  email: 'rahim@example.com',
  telephone: '+880 1712-119253',
  companyName: 'Acme Ltd',
  country: 'Bangladesh',
  projectType: 'web-application',
  requiredServices: ['business-websites', 'admin-dashboards'],
  budgetRange: 'medium',
  preferredStartDate: '2026-10-01',
  targetCompletionDate: '2026-12-15',
  maintenanceRequired: 'yes',
  attachmentCount: 2,
  notesCount: 1,
};

/** Splits a CSV body (after the BOM) into records/fields, honouring quotes. Test-local reader. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] as string;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
    } else field += ch;
  }
  return rows;
}

const body = (csv: string): string => (csv.startsWith(UTF8_BOM) ? csv.slice(UTF8_BOM.length) : csv);

describe('buildQuotationCsv', () => {
  it('writes a BOM, the documented header and one flat row per request', () => {
    const csv = buildQuotationCsv([BASE]);
    assert.ok(csv.startsWith(UTF8_BOM));
    const rows = parseCsv(body(csv));
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], [...QUOTATION_CSV_HEADER]);
    assert.equal(rows[1]?.length, QUOTATION_CSV_HEADER.length);
  });

  it('writes enum values as display labels and attachments as a count only', () => {
    const [, row] = parseCsv(body(buildQuotationCsv([BASE])));
    const at = (name: (typeof QUOTATION_CSV_HEADER)[number]) => row?.[QUOTATION_CSV_HEADER.indexOf(name)];
    assert.equal(at('projectType'), 'Web application');
    assert.equal(at('requiredServices'), 'Business website development; Admin dashboard development');
    assert.equal(at('budgetRange'), 'Medium project');
    assert.equal(at('maintenanceRequired'), 'Yes');
    assert.equal(at('attachmentCount'), '2');
    assert.equal(at('notesCount'), '1');
    assert.equal(at('status'), 'reviewing');
  });

  it('has no column for attachment URLs, internal note text or the long free-text answers', () => {
    const names = QUOTATION_CSV_HEADER as readonly string[];
    for (const excluded of [
      'attachments',
      'attachmentUrls',
      'notes',
      'businessObjectives',
      'targetUsers',
      'requiredFeatures',
      'integrations',
      'referenceWebsites',
      'additionalMessage',
    ]) {
      assert.equal(names.includes(excluded), false, excluded);
    }
    // Only counts for attachments and notes.
    assert.ok(names.includes('attachmentCount') && names.includes('notesCount'));
  });

  it('quotes fields containing a comma, a double quote or a line break, and doubles quotes', () => {
    const hostile = {
      ...BASE,
      fullName: 'Rahim, "Rocky" Uddin',
      companyName: 'Acme\nLtd\r\nHoldings',
      country: 'Side, by "side"',
    };
    const [, row] = parseCsv(body(buildQuotationCsv([hostile])));
    const at = (name: (typeof QUOTATION_CSV_HEADER)[number]) => row?.[QUOTATION_CSV_HEADER.indexOf(name)];
    // Round-trips exactly through a real CSV reader, and the raw text shows RFC 4180 quoting.
    assert.equal(at('fullName'), 'Rahim, "Rocky" Uddin');
    assert.equal(at('companyName'), 'Acme\nLtd\r\nHoldings');
    assert.equal(at('country'), 'Side, by "side"');
    assert.equal(row?.length, QUOTATION_CSV_HEADER.length, 'no stray columns from embedded commas');
    assert.ok(buildQuotationCsv([hostile]).includes('"Rahim, ""Rocky"" Uddin"'));
  });

  it('neutralises spreadsheet formulas but keeps a real phone number intact', () => {
    const formula = {
      ...BASE,
      fullName: '=HYPERLINK("http://evil.example","x")',
      companyName: '@SUM(1+1)',
      country: '-2+3',
      email: '+cmd|calc@example.com',
    };
    const [, row] = parseCsv(body(buildQuotationCsv([formula])));
    const at = (name: (typeof QUOTATION_CSV_HEADER)[number]) => row?.[QUOTATION_CSV_HEADER.indexOf(name)];
    assert.equal(at('fullName'), `'=HYPERLINK("http://evil.example","x")`);
    assert.equal(at('companyName'), "'@SUM(1+1)");
    assert.equal(at('email'), "'+cmd|calc@example.com");
    assert.equal(at('telephone'), '+880 1712-119253', 'a real phone number must not be corrupted');
  });

  it('reads a legacy "responded" status as reviewing and tolerates missing optional fields', () => {
    const legacy = {
      ...BASE,
      status: 'responded',
      companyName: undefined,
      targetCompletionDate: null,
      archived: undefined,
    };
    const [, row] = parseCsv(body(buildQuotationCsv([legacy])));
    const at = (name: (typeof QUOTATION_CSV_HEADER)[number]) => row?.[QUOTATION_CSV_HEADER.indexOf(name)];
    assert.equal(at('status'), 'reviewing');
    assert.equal(at('companyName'), '');
    assert.equal(at('targetCompletionDate'), '');
    assert.equal(at('archived'), 'false');
  });

  it('an empty result is just the header row', () => {
    assert.equal(parseCsv(body(buildQuotationCsv([]))).length, 1);
  });
});
