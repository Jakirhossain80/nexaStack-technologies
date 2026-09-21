import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findUnsafeArticleHtml, isSafeUrl } from './articleHtml.js';
import { sniffFileType } from './sniffFileType.js';

const bytes = (...values: number[]) => Uint8Array.from(values);

describe('sniffFileType (real type from magic bytes; the declared type and file name are never consulted)', () => {
  it('recognises PDF, PNG and JPEG by their first bytes', () => {
    assert.equal(sniffFileType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d)), 'application/pdf');
    assert.equal(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'image/png');
    assert.equal(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg');
  });

  it('returns null for empty, truncated, and other content (an .exe renamed .pdf, HTML, SVG, GIF)', () => {
    assert.equal(sniffFileType(bytes()), null);
    assert.equal(sniffFileType(bytes(0x25, 0x50, 0x44)), null); // %PD: one byte short of a PDF header
    assert.equal(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47)), null); // PNG needs all 8 signature bytes
    assert.equal(sniffFileType(bytes(0xff, 0xd8)), null);
    assert.equal(sniffFileType(new TextEncoder().encode('MZ\x90\x00')), null); // Windows executable
    assert.equal(sniffFileType(new TextEncoder().encode('<script>alert(1)</script>')), null);
    assert.equal(
      sniffFileType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')),
      null,
    );
    assert.equal(sniffFileType(new TextEncoder().encode('GIF89a')), null);
  });
});

describe('isSafeUrl', () => {
  it('accepts https, http, mailto, a site path and a fragment', () => {
    for (const ok of [
      'https://example.com',
      'http://example.com/a?b=c#d',
      'mailto:test@example.com',
      '/blog/post',
      '#section',
    ]) {
      assert.equal(isSafeUrl(ok), true, ok);
    }
  });

  it('refuses script schemes, protocol-relative URLs, control characters, backslashes and empty values', () => {
    for (const bad of [
      '',
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      '//evil.example',
      '/\\evil.example',
      'https://',
      'mailto:',
      'ftp://example.com',
      'example.com',
      'https://example.com/a b',
    ]) {
      assert.equal(isSafeUrl(bad), false, JSON.stringify(bad));
    }
  });
});

describe('findUnsafeArticleHtml (the second, independent check on stored blog HTML)', () => {
  it('passes everything the markdown renderer can emit', () => {
    const html = [
      '<h2 id="intro">Intro</h2>',
      '<p>Text with <strong>bold</strong>, <em>italics</em> and <code>code</code> &amp; entities &lt;like this&gt;.</p>',
      '<ul><li>One</li><li>Two</li></ul>',
      '<ol><li>First</li></ol>',
      '<blockquote><p>Quote</p></blockquote>',
      '<pre><code class="language-ts">const x = 1;</code></pre>',
      '<p><a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">Link</a></p>',
      '<h3 id="sub-heading">Sub</h3>',
    ].join('');
    assert.equal(findUnsafeArticleHtml(html), null);
  });

  it('passes plain text and the empty string', () => {
    assert.equal(findUnsafeArticleHtml(''), null);
    assert.equal(findUnsafeArticleHtml('just text &amp; nothing else'), null);
  });

  const unsafe: [string, string][] = [
    ['a script tag', '<script>alert(1)</script>'],
    ['an img with an onerror handler', '<img src=x onerror=alert(1)>'],
    ['an iframe', '<iframe src="https://evil.example"></iframe>'],
    ['an event-handler attribute on an allowed tag', '<p onclick="alert(1)">x</p>'],
    ['a style attribute', '<p style="position:fixed">x</p>'],
    ['a javascript: link', '<a href="javascript:alert(1)" rel="noopener noreferrer">x</a>'],
    [
      'an entity-obfuscated javascript: link',
      '<a href="&#106;avascript:alert(1)" rel="noopener noreferrer">x</a>',
    ],
    ['a link with a wrong rel', '<a href="https://example.com" rel="opener">x</a>'],
    ['a link with target', '<a href="https://example.com" target="_blank">x</a>'],
    ['an uppercase tag', '<P>x</P>'],
    ['a stray closing bracket in text', '<p>a > b</p>'],
    ['a raw "<" in text', '<p>a < b</p>'],
    ['an unterminated tag', '<p>ok</p><a href="https://example.com"'],
    ['attributes on a closing tag', '<p>x</p onclick="alert(1)">'],
    ['a code class that is not a language-* class', '<pre><code class="x y">x</code></pre>'],
    ['a heading id with uppercase or spaces', '<h2 id="Bad Id">x</h2>'],
    ['a comment', '<!-- hidden -->'],
    ['an svg', '<svg onload=alert(1)>'],
  ];
  for (const [label, html] of unsafe) {
    it(`rejects ${label}`, () => {
      assert.equal(typeof findUnsafeArticleHtml(html), 'string');
    });
  }
});
