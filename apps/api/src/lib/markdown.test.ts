import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findUnsafeArticleHtml } from '@nexastack/shared';

import { isSafeUrl, renderArticle, renderInline, renderMarkdown } from './markdown.js';

/** Every tag name that appears in `html`, so a test can assert nothing unexpected was emitted. */
function tagNames(html: string): Set<string> {
  return new Set(
    [...html.matchAll(/<\/?([a-z][a-z0-9]*)/gi)].map((m) => (m[1] ?? '').toLowerCase()),
  );
}

const ALLOWED_TAGS = new Set([
  'h2',
  'h3',
  'p',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'strong',
  'em',
]);

describe('renderMarkdown: structure', () => {
  it('renders ## and ### headings with ids and builds the table of contents', () => {
    const { html, tableOfContents } = renderMarkdown(
      '## Getting started\n\n### Install it\n\nBody.',
    );
    assert.match(html, /<h2 id="getting-started">Getting started<\/h2>/);
    assert.match(html, /<h3 id="install-it">Install it<\/h3>/);
    assert.deepEqual(tableOfContents, [
      { id: 'getting-started', text: 'Getting started', level: 2 },
      { id: 'install-it', text: 'Install it', level: 3 },
    ]);
  });

  it('makes duplicate heading ids unique', () => {
    const { tableOfContents } = renderMarkdown('## Setup\n\n## Setup\n\n## Setup');
    assert.deepEqual(
      tableOfContents.map((t) => t.id),
      ['setup', 'setup-2', 'setup-3'],
    );
  });

  it('does not treat # (h1) or #### as headings; the page template owns the h1', () => {
    const { html, tableOfContents } = renderMarkdown('# Title\n\n#### Deep');
    assert.equal(tableOfContents.length, 0);
    assert.doesNotMatch(html, /<h[1-6]/);
  });

  it('renders bullet and numbered lists, and blockquotes', () => {
    const { html } = renderMarkdown('- one\n- two\n\n1. first\n2. second\n\n> quoted words');
    assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
    assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
    assert.match(html, /<blockquote><p>quoted words<\/p><\/blockquote>/);
  });

  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    const { html } = renderMarkdown('line one\nline two\n\nsecond paragraph');
    assert.equal(html, '<p>line one line two</p>\n<p>second paragraph</p>');
  });

  it('renders fenced code literally, including markup-looking text', () => {
    const { html } = renderMarkdown('```ts\nconst a = "<b>x</b>" && **not bold**;\n```');
    assert.equal(
      html,
      '<pre><code class="language-ts">const a = &quot;&lt;b&gt;x&lt;/b&gt;&quot; &amp;&amp; **not bold**;</code></pre>',
    );
  });

  it('terminates on an unclosed fence and on empty input', () => {
    assert.match(
      renderMarkdown('```\nnever closed').html,
      /<pre><code>never closed<\/code><\/pre>/,
    );
    assert.equal(renderMarkdown('').html, '');
    assert.equal(renderMarkdown('   \n\n  ').html, '');
  });

  it('handles Windows line endings', () => {
    assert.equal(renderMarkdown('a\r\n\r\nb').html, '<p>a</p>\n<p>b</p>');
  });
});

describe('renderInline', () => {
  it('renders bold, italic and code', () => {
    assert.equal(
      renderInline('**b** and *i* and `c`'),
      '<strong>b</strong> and <em>i</em> and <code>c</code>',
    );
  });

  it('does not treat snake_case or 2*3*4 as emphasis', () => {
    assert.equal(renderInline('use snake_case_name here'), 'use snake_case_name here');
  });

  it('does not interpret markup inside a code span', () => {
    assert.equal(renderInline('`**x** <b>`'), '<code>**x** &lt;b&gt;</code>');
  });

  it('renders safe links, adding rel only to external ones', () => {
    assert.equal(
      renderInline('[home](/services) [ext](https://example.com/a?b=1&c=2)'),
      '<a href="/services">home</a> <a href="https://example.com/a?b=1&amp;c=2" rel="noopener noreferrer">ext</a>',
    );
  });
});

describe('renderMarkdown: XSS hardening', () => {
  const attacks: readonly [name: string, source: string][] = [
    ['script tag', '<script>alert(1)</script>'],
    ['img onerror', '<img src=x onerror=alert(1)>'],
    ['svg onload', '<svg onload=alert(1)>'],
    ['iframe', '<iframe src="javascript:alert(1)"></iframe>'],
    ['javascript link', '[click](javascript:alert(1))'],
    ['mixed-case javascript link', '[click](JaVaScRiPt:alert(1))'],
    ['entity-encoded javascript link', '[click](&#106;avascript:alert(1))'],
    ['tab-split javascript link', '[click](java\tscript:alert(1))'],
    ['data link', '[click](data:text/html;base64,PHNjcmlwdD4=)'],
    ['vbscript link', '[click](vbscript:msgbox(1))'],
    ['protocol-relative link', '[click](//evil.example/x)'],
    ['backslash protocol-relative link', '[click](/\\evil.example/x)'],
    ['attribute breakout in href', '[click](https://a.example/"onmouseover="alert(1))'],
    ['attribute breakout via quote', '[a" onclick="alert(1)](https://ok.example)'],
    ['angle bracket in heading', '## <script>alert(1)</script>'],
    ['angle bracket in list', '- <b onmouseover=alert(1)>x</b>'],
    ['angle bracket in quote', '> <iframe>'],
    ['angle bracket in emphasis', '**<script>x</script>**'],
    ['html comment / CDATA', '<!-- x --><![CDATA[ <script>x</script> ]]>'],
    ['fence language breakout', '```js" onmouseover="alert(1)\ncode\n```'],
  ];

  for (const [name, source] of attacks) {
    it(`emits no active markup: ${name}`, () => {
      const { html } = renderMarkdown(source);

      // Only tags this renderer writes itself may appear.
      for (const tag of tagNames(html)) {
        assert.ok(ALLOWED_TAGS.has(tag), `unexpected <${tag}> in: ${html}`);
      }
      // No event-handler attribute, no dangerous scheme, and no unescaped angle bracket from the
      // author's text can be present in a real attribute or tag.
      assert.doesNotMatch(html, /<[^>]+\son\w+\s*=/i, `event handler in: ${html}`);
      assert.doesNotMatch(
        html,
        /href="\s*(?:javascript|data|vbscript):/i,
        `bad scheme in: ${html}`,
      );
      assert.doesNotMatch(html, /href="\/\//, `protocol-relative href in: ${html}`);
      assert.doesNotMatch(html, /<script|<img|<svg|<iframe/i, `raw tag in: ${html}`);
    });

    // The independent output check (also run by the public site before injecting stored HTML)
    // must accept everything the renderer emits for the same hostile input, or a legitimate
    // post containing this text would be refused, or worse, shown as the fallback.
    it(`passes the article-HTML allow-list: ${name}`, () => {
      assert.equal(findUnsafeArticleHtml(renderMarkdown(source).html), null);
      assert.doesNotThrow(() => renderArticle(source));
    });
  }

  it('keeps the words of a link whose target is rejected, but drops the link', () => {
    assert.equal(renderInline('[click me](javascript:alert(1))'), 'click me)');
    assert.equal(renderInline('[click me](//evil.example)'), 'click me');
  });
});

describe('findUnsafeArticleHtml: the stored-HTML allow-list', () => {
  it('accepts a realistic post covering every construct the renderer can emit', () => {
    const source = [
      '## Getting started',
      '',
      '### A [link](https://example.com/a?b=1&c=2), a [page](/services) and an [anchor](#top)',
      '',
      'Some **bold**, *italic* and `code` with <b>escaped</b> tags & an "ampersand".',
      '',
      '- one',
      '- two',
      '',
      '1. first',
      '',
      '> a quote',
      '',
      '```ts',
      'const a = "<b>" && 1;',
      '```',
    ].join('\n');
    assert.equal(findUnsafeArticleHtml(renderMarkdown(source).html), null);
    assert.equal(findUnsafeArticleHtml(''), null);
    assert.equal(findUnsafeArticleHtml('plain text only'), null);
  });

  // Hand-written HTML, as it would look if it reached the database WITHOUT going through the renderer.
  const hostile: readonly [name: string, html: string][] = [
    ['script tag', '<p>hi</p><script>alert(1)</script>'],
    ['upper-case script tag', '<SCRIPT>alert(1)</SCRIPT>'],
    ['img onerror', '<p><img src=x onerror=alert(1)></p>'],
    ['svg onload', '<svg onload="alert(1)"></svg>'],
    ['iframe', '<iframe src="https://evil.example"></iframe>'],
    ['style tag', '<style>body{display:none}</style>'],
    ['event handler on an allowed tag', '<p onclick="alert(1)">x</p>'],
    ['event handler on a link', '<a href="/ok" onmouseover="alert(1)">x</a>'],
    ['style attribute', '<p style="position:fixed">x</p>'],
    ['javascript link', '<a href="javascript:alert(1)">x</a>'],
    ['mixed-case javascript link', '<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['numeric-entity javascript link', '<a href="&#106;avascript:alert(1)">x</a>'],
    ['named-entity javascript link', '<a href="java&Tab;script:alert(1)">x</a>'],
    ['data link', '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>'],
    ['protocol-relative link', '<a href="//evil.example/x">x</a>'],
    ['single-quoted attribute', "<a href='/ok'>x</a>"],
    ['unquoted attribute', '<a href=/ok>x</a>'],
    ['attribute breakout', '<a href="/ok"onmouseover="alert(1)">x</a>'],
    ['id with a quote-like character', '<h2 id="a b">x</h2>'],
    ['class outside the language- pattern', '<code class="x y">x</code>'],
    ['rel other than noopener noreferrer', '<a href="/ok" rel="opener">x</a>'],
    ['attribute on a closing tag', '<p>x</p onclick="1">'],
    ['raw > in text', '<p>a > b</p>'],
    ['raw < in text', '<p>a < b</p>'],
    ['unterminated tag', '<p>x</p><a href="/ok"'],
    ['html comment', '<p>x</p><!-- hidden -->'],
    ['CDATA', '<![CDATA[ <script>x</script> ]]>'],
    ['tag name not on the allow-list', '<h1>x</h1>'],
    ['data-attribute', '<p data-x="1">x</p>'],
    ['null byte in a link', '<a href="https://a.example/\u0000">x</a>'],
  ];

  for (const [name, html] of hostile) {
    it(`rejects: ${name}`, () => {
      assert.notEqual(findUnsafeArticleHtml(html), null, `should have been rejected: ${html}`);
    });
  }
});

describe('renderArticle', () => {
  it('returns exactly what renderMarkdown returns for input it accepts', () => {
    const source = '## Title\n\nBody with a [link](/x).';
    assert.deepEqual(renderArticle(source), renderMarkdown(source));
  });
});

describe('isSafeUrl', () => {
  const safe = [
    'https://example.com',
    'http://example.com/a',
    'mailto:hi@example.com',
    '/services',
    '/a/b?c=d#e',
    '#section',
  ];
  const unsafe = [
    '',
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    '//evil.example',
    '/\\evil.example',
    'https:///nohost',
    'http://',
    'ftp://example.com',
    'example.com',
    'https://a b',
    'https://a\u0000b',
    'mailto:',
    'mailto:/x',
    '\\\\evil',
  ];

  for (const url of safe)
    it(`accepts ${JSON.stringify(url)}`, () => assert.equal(isSafeUrl(url), true));
  for (const url of unsafe)
    it(`rejects ${JSON.stringify(url)}`, () => assert.equal(isSafeUrl(url), false));
});
