import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import {
  QUOTATION_RATE_LIMIT,
  QUOTATION_UPLOAD_RATE_LIMIT,
  checkQuotationRateLimit,
  checkQuotationUploadRateLimit,
} from '@/lib/quotationRateLimit';
import { CONTACT_RATE_LIMIT, checkContactRateLimit, getClientIp } from '@/lib/rateLimit';

const WINDOW_SECONDS = 15 * 60;

afterEach(() => {
  mock.restoreAll();
});

/** Every call uses its own IP so the limiters' shared, per-process stores never leak between tests. */
let counter = 0;
const freshIp = () => `203.0.113.${++counter}`;

describe('contact rate limiter (10 per 15 minutes per IP)', () => {
  it('allows exactly the limit, then refuses with a retry time inside the window', () => {
    const ip = freshIp();
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++)
      assert.equal(checkContactRateLimit(ip).allowed, true, `request ${i + 1}`);
    const blocked = checkContactRateLimit(ip);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= WINDOW_SECONDS);
    assert.equal(checkContactRateLimit(ip).allowed, false, 'and it stays refused');
  });

  it('counts each IP separately', () => {
    const a = freshIp();
    const b = freshIp();
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++) checkContactRateLimit(a);
    assert.equal(checkContactRateLimit(a).allowed, false);
    assert.equal(checkContactRateLimit(b).allowed, true);
  });

  it('opens a fresh window once the old one has expired', () => {
    const ip = freshIp();
    const start = Date.now();
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++) checkContactRateLimit(ip);
    assert.equal(checkContactRateLimit(ip).allowed, false);
    mock.method(Date, 'now', () => start + (WINDOW_SECONDS + 1) * 1000);
    assert.equal(checkContactRateLimit(ip).allowed, true);
  });
});

describe('quotation rate limiters', () => {
  it(`submissions: ${QUOTATION_RATE_LIMIT} per window, then refused`, () => {
    const ip = freshIp();
    for (let i = 0; i < QUOTATION_RATE_LIMIT; i++)
      assert.equal(checkQuotationRateLimit(ip).allowed, true);
    assert.equal(checkQuotationRateLimit(ip).allowed, false);
  });

  it(`uploads: ${QUOTATION_UPLOAD_RATE_LIMIT} per window, kept in a separate store from submissions`, () => {
    const ip = freshIp();
    for (let i = 0; i < QUOTATION_RATE_LIMIT; i++) checkQuotationRateLimit(ip);
    assert.equal(checkQuotationRateLimit(ip).allowed, false);
    for (let i = 0; i < QUOTATION_UPLOAD_RATE_LIMIT; i++) {
      assert.equal(checkQuotationUploadRateLimit(ip).allowed, true, `upload ${i + 1}`);
    }
    assert.equal(checkQuotationUploadRateLimit(ip).allowed, false);
  });

  it('is independent of the contact limiter', () => {
    const ip = freshIp();
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++) checkContactRateLimit(ip);
    assert.equal(checkContactRateLimit(ip).allowed, false);
    assert.equal(checkQuotationRateLimit(ip).allowed, true);
  });
});

describe('getClientIp', () => {
  const request = (headers: Record<string, string>) =>
    new Request('http://localhost/api/contact', { headers });

  it('uses the first x-forwarded-for entry, trimmed', () => {
    assert.equal(
      getClientIp(request({ 'x-forwarded-for': ' 198.51.100.7 , 10.0.0.1, 10.0.0.2' })),
      '198.51.100.7',
    );
  });

  it('falls back to x-real-ip, then to a fixed key (so an unidentifiable client is still limited)', () => {
    assert.equal(getClientIp(request({ 'x-real-ip': ' 198.51.100.9 ' })), '198.51.100.9');
    assert.equal(getClientIp(request({})), 'unknown');
  });

  it('prefers x-forwarded-for over x-real-ip', () => {
    assert.equal(
      getClientIp(request({ 'x-forwarded-for': '198.51.100.7', 'x-real-ip': '198.51.100.9' })),
      '198.51.100.7',
    );
  });
});
