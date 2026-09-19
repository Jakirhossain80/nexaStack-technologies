import type { BlogTocItem } from '@nexastack/shared';

import { slugify } from './slug.js';

/**
 * A deliberately small markdown renderer for blog post bodies. Zero dependencies.
 *
 * SECURITY MODEL — the output is stored as `contentHtml` and rendered with
 * `dangerouslySetInnerHTML` on the public site, so it is only safe if this file never emits
 * anything the author controls except as escaped text. That is guaranteed by construction:
 *
 *   1. There is no raw-HTML passthrough. Every `<`, `>`, `&`, `"` and `'` in author text is
 *      escaped; the only tags in the output are the ones this file writes itself.
 *   2. Link targets are allow-listed (`http:`, `https:`, `mailto:`, or a single-slash relative
 *      path or `#fragment`). Anything else (`javascript:`, `data:`, `//host`, `/\host`, control
 *      characters, backslashes) is dropped and only the link text is kept.
 *   3. The only attribute values that come from the author are the escaped link `href` and a
 *      code-fence language restricted to `[a-z0-9+#-]`.
 *
 * Supported: `##` and `###` headings, paragraphs, `-`/`*` bullet lists, `1.` numbered lists,
 * `>` blockquotes, ``` fenced code blocks, and inline **bold**, *italic*, `code`, [links](url).
 * Only elements `.article-prose` in styles/globals.css actually styles are emitted.
 * Not supported (rendered as plain text): raw HTML, images, tables, nested lists, `#` and `####`
 * headings. `#` is not a heading because the page template already owns the one `<h1>`.
 */

export interface RenderedMarkdown {
  html: string;
  tableOfContents: BlogTocItem[];
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** `https://…`, `http://…`, `mailto:…`, `/path`, or `#fragment` — and nothing else. */
export function isSafeUrl(url: string): boolean {
  // Any control character, space or backslash: browsers normalise `/\host` to `//host`, and
  // embedded control characters are a classic filter-bypass for `javascript:`.
  // eslint-disable-next-line no-control-regex
  if (url.length === 0 || /[\u0000- \u007f-\u009f\\]/.test(url)) return false;
  // A host must follow `http(s)://`; `mailto:` must be followed by an address.
  if (/^https?:\/\/[^/]/i.test(url) || /^mailto:[^/]/i.test(url)) return true;
  if (url.startsWith('#')) return true;
  // A single leading slash; `//` would be protocol-relative (off-site).
  return url.startsWith('/') && !url.startsWith('//');
}

const CODE_SPAN = /`([^`\n]+)`/g;
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Emphasis on text that is ALREADY escaped, so the only `<` in it are the ones added here. */
function renderEmphasis(escaped: string): string {
  return escaped
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
}

/** Text with no code spans left: links first (validated), then emphasis on the remainder. */
function renderTextWithLinks(text: string): string {
  let out = '';
  let last = 0;

  for (const match of text.matchAll(LINK)) {
    const [whole, label = '', url = ''] = match;
    const start = match.index ?? 0;
    out += renderEmphasis(escapeHtml(text.slice(last, start)));

    const labelHtml = renderEmphasis(escapeHtml(label));
    if (isSafeUrl(url)) {
      const external = /^https?:/i.test(url);
      const rel = external ? ' rel="noopener noreferrer"' : '';
      out += `<a href="${escapeHtml(url)}"${rel}>${labelHtml}</a>`;
    } else {
      out += labelHtml; // unsafe target: keep the words, drop the link
    }
    last = start + whole.length;
  }

  return out + renderEmphasis(escapeHtml(text.slice(last)));
}

/** Inline markup for one line of author text. Code spans are cut out first so nothing inside
 * them is interpreted. */
export function renderInline(raw: string): string {
  let out = '';
  let last = 0;

  for (const match of raw.matchAll(CODE_SPAN)) {
    const start = match.index ?? 0;
    out += renderTextWithLinks(raw.slice(last, start));
    out += `<code>${escapeHtml(match[1] ?? '')}</code>`;
    last = start + match[0].length;
  }

  return out + renderTextWithLinks(raw.slice(last));
}

/** Heading text with its inline markers removed, for the table of contents and the id. */
function toPlainText(raw: string): string {
  return raw
    .replace(LINK, '$1')
    .replace(/`([^`\n]*)`/g, '$1')
    .replace(/\*\*([^*\n]*)\*\*/g, '$1')
    .replace(/(^|[^*\w])\*([^*\n]*)\*(?![*\w])/g, '$1$2')
    .replace(/(^|[^\w])_([^_\n]*)_(?!\w)/g, '$1$2')
    .trim();
}

export function slugifyHeading(text: string): string {
  return slugify(text, 'section');
}

const HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/;
const FENCE = /^```([A-Za-z0-9+#-]{0,20})\s*$/;
const BULLET = /^[-*]\s+(.+)$/;
const NUMBERED = /^\d{1,3}[.)]\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;

export function renderMarkdown(source: string): RenderedMarkdown {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  const tableOfContents: BlogTocItem[] = [];
  const usedIds = new Map<string, number>();

  const uniqueId = (base: string): string => {
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    // Fenced code block: everything up to the closing fence (or the end) is literal text.
    const fence = FENCE.exec(line.trim());
    if (fence) {
      const language = (fence[1] ?? '').toLowerCase();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      index += 1; // the closing fence
      const cls = language ? ` class="language-${language}"` : '';
      html.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const level = heading[1]?.length === 2 ? 2 : 3;
      const raw = heading[2] ?? '';
      const text = toPlainText(raw);
      const id = uniqueId(slugifyHeading(text));
      tableOfContents.push({ id, text, level });
      html.push(`<h${level} id="${id}">${renderInline(raw)}</h${level}>`);
      index += 1;
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (bullet || numbered) {
      const pattern = bullet ? BULLET : NUMBERED;
      const tag = bullet ? 'ul' : 'ol';
      const items: string[] = [];
      while (index < lines.length) {
        const item = pattern.exec(lines[index] ?? '');
        if (!item) break;
        items.push(`<li>${renderInline(item[1] ?? '')}</li>`);
        index += 1;
      }
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted: string[] = [];
      while (index < lines.length) {
        const item = QUOTE.exec(lines[index] ?? '');
        if (!item) break;
        quoted.push(item[1] ?? '');
        index += 1;
      }
      html.push(`<blockquote><p>${renderInline(quoted.join(' ').trim())}</p></blockquote>`);
      continue;
    }

    // Paragraph: consecutive lines that are not the start of another block.
    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? '';
      if (
        current.trim() === '' ||
        FENCE.test(current.trim()) ||
        HEADING.test(current) ||
        BULLET.test(current) ||
        NUMBERED.test(current) ||
        QUOTE.test(current)
      ) {
        break;
      }
      paragraph.push(current.trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }

  return { html: html.join('\n'), tableOfContents };
}
