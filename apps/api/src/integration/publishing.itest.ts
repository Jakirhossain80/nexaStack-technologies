import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { CONTENT_STATUSES, canTransition, findUnsafeArticleHtml } from '@nexastack/shared';

import { postBody, seedPost } from './support/fixtures.js';
import { API, startApi, type Api } from './support/harness.js';

/**
 * The Blog CMS publishing state machine through the REAL API and a real database: draft -> publish ->
 * unpublish -> archive -> restore, each step checked in the database, the audit log, and (as far as this tier
 * can) in what the PUBLIC site would read. The public site reads `status: 'published'` directly from MongoDB
 * (apps/web/lib/blog.ts), so `publicSlugs()` below is that same predicate; the real HTTP behaviour of /blog and
 * /blog/[slug] is asserted in the Playwright tier.
 *
 * Also the XSS half: hostile markdown goes through the real renderer and the stored HTML must satisfy the
 * strict allow-list (`findUnsafeArticleHtml`) that both apps enforce.
 */

let api: Api;
let editorCookie: string;
let adminCookie: string;
let editorId: string;
let adminId: string;
let categoryId: string;

before(async () => {
  api = await startApi();
  const editor = await api.seedAdmin('content_editor');
  const admin = await api.seedAdmin('admin');
  editorId = editor.id;
  adminId = admin.id;
  editorCookie = await api.loginAs(editor);
  adminCookie = await api.loginAs(admin);
  categoryId = String((await api.seedCategory()).id);
});

after(async () => {
  await api.stop();
});

const createDraft = async (overrides: Record<string, unknown> = {}) => {
  const reply = await api.request(`${API}/admin/blog/posts`, {
    method: 'POST',
    cookie: editorCookie,
    body: postBody(categoryId, overrides),
  });
  assert.equal(reply.status, 201, JSON.stringify(reply.body));
  return reply.body.data.post as { id: string; slug: string; status: string };
};

const setStatus = (id: string, status: string, cookie = adminCookie) =>
  api.request(`${API}/admin/blog/posts/${id}/status`, { method: 'POST', cookie, body: { status } });

const stored = (id: string) => api.models.BlogPost.findById(id).lean();

/** What the public blog can show: exactly the published posts. */
async function publicSlugs(): Promise<string[]> {
  const rows = await api.models.BlogPost.find({ status: 'published' }).select('slug').lean();
  return rows.map((row) => row.slug);
}

describe('the lifecycle, step by step', () => {
  it('draft -> published -> unpublished -> published -> archived -> draft -> published', async () => {
    const draft = await createDraft();

    // DRAFT: exists, is not public, has never been published.
    let row = await stored(draft.id);
    assert.equal(row?.status, 'draft');
    assert.equal(row?.publishedAt, null);
    assert.equal(String(row?.createdBy), editorId);
    assert.ok(!(await publicSlugs()).includes(draft.slug), 'a draft is not public');

    // PUBLISH
    const published = await setStatus(draft.id, 'published');
    assert.equal(published.status, 200);
    assert.equal(published.body.data.post.status, 'published');
    row = await stored(draft.id);
    assert.equal(row?.status, 'published');
    assert.ok(row?.publishedAt instanceof Date, 'publishedAt is set on the first publish');
    const firstPublishedAt = row!.publishedAt!.getTime();
    assert.equal(String(row?.updatedBy), adminId);
    assert.ok((await publicSlugs()).includes(draft.slug), 'a published post is public');

    // UNPUBLISH: taken down, keeps its original publishedAt.
    assert.equal((await setStatus(draft.id, 'unpublished')).status, 200);
    row = await stored(draft.id);
    assert.equal(row?.status, 'unpublished');
    assert.equal(
      row?.publishedAt?.getTime(),
      firstPublishedAt,
      'unpublishing keeps the original publish date',
    );
    assert.ok(
      !(await publicSlugs()).includes(draft.slug),
      'an unpublished post is no longer public',
    );

    // REPUBLISH: back on the site, publishedAt is NOT reset.
    await new Promise((resolve) => setTimeout(resolve, 15));
    assert.equal((await setStatus(draft.id, 'published')).status, 200);
    row = await stored(draft.id);
    assert.equal(
      row?.publishedAt?.getTime(),
      firstPublishedAt,
      'publishedAt is set on the FIRST publish only',
    );
    assert.ok((await publicSlugs()).includes(draft.slug));

    // ARCHIVE: retired, not public.
    assert.equal((await setStatus(draft.id, 'archived')).status, 200);
    assert.equal((await stored(draft.id))?.status, 'archived');
    assert.ok(!(await publicSlugs()).includes(draft.slug), 'an archived post is not public');

    // An archived post cannot be published directly: it must be restored to a draft first.
    const direct = await setStatus(draft.id, 'published');
    assert.equal(direct.status, 409);
    assert.equal(direct.body.error?.code, 'CONFLICT');
    assert.equal(
      (await stored(draft.id))?.status,
      'archived',
      'a refused change leaves the status alone',
    );
    assert.ok(!(await publicSlugs()).includes(draft.slug));

    // RESTORE -> DRAFT -> PUBLISH again.
    assert.equal((await setStatus(draft.id, 'draft')).status, 200);
    assert.equal((await stored(draft.id))?.status, 'draft');
    assert.ok(
      !(await publicSlugs()).includes(draft.slug),
      'a restored post is a draft, not public',
    );
    assert.equal((await setStatus(draft.id, 'published')).status, 200);
    assert.ok((await publicSlugs()).includes(draft.slug));
  });

  it('every step is written to the audit log against the acting admin', async () => {
    const draft = await createDraft();
    await setStatus(draft.id, 'published');
    await setStatus(draft.id, 'unpublished');
    await setStatus(draft.id, 'archived');
    await setStatus(draft.id, 'draft');
    for (const eventType of [
      'blog_post_created',
      'blog_post_published',
      'blog_post_unpublished',
      'blog_post_archived',
      'blog_post_restored',
    ] as const) {
      const entries = await api.models.AdminActivityLog.find({
        eventType,
        'metadata.postId': draft.id,
      }).lean();
      assert.equal(entries.length, 1, `${eventType} should be logged exactly once for this post`);
      assert.equal(
        String(entries[0]?.adminUserId),
        eventType === 'blog_post_created' ? editorId : adminId,
      );
    }
  });
});

describe('every from -> to pair, against the shared transition table', () => {
  for (const from of CONTENT_STATUSES) {
    for (const to of CONTENT_STATUSES) {
      const allowed = canTransition(from, to);
      it(`${from} -> ${to} is ${allowed ? 'allowed (200)' : 'refused (409) and changes nothing'}`, async () => {
        const post = await seedPost(api, categoryId, adminId, { status: from });
        const reply = await setStatus(post.id, to);
        if (allowed) {
          assert.equal(reply.status, 200, JSON.stringify(reply.body));
          assert.equal((await stored(post.id))?.status, to);
        } else {
          assert.equal(reply.status, 409, JSON.stringify(reply.body));
          assert.equal(reply.body.error?.code, 'CONFLICT');
          assert.equal((await stored(post.id))?.status, from);
        }
      });
    }
  }

  it('an unknown status is a 400, a valid id that does not exist is a 404, and neither writes anything', async () => {
    const post = await seedPost(api, categoryId, adminId);
    assert.equal((await setStatus(post.id, 'scheduled')).status, 400);
    assert.equal((await stored(post.id))?.status, 'draft');
    assert.equal((await setStatus('507f1f77bcf86cd799439099', 'published')).status, 404);
  });
});

describe('rules around the state machine', () => {
  it('a content_editor cannot publish or unpublish, and the post stays as it was', async () => {
    const draft = await createDraft();
    assert.equal((await setStatus(draft.id, 'published', editorCookie)).status, 403);
    assert.equal((await stored(draft.id))?.status, 'draft');
    await setStatus(draft.id, 'published');
    assert.equal((await setStatus(draft.id, 'unpublished', editorCookie)).status, 403);
    assert.equal((await stored(draft.id))?.status, 'published');
  });

  it('the slug is locked once a post has been published (changing it would break links)', async () => {
    const draft = await createDraft();
    // Editable while it is still a draft.
    const renamed = await api.request(`${API}/admin/blog/posts/${draft.id}`, {
      method: 'PATCH',
      cookie: editorCookie,
      body: postBody(categoryId, { slug: 'a-new-draft-slug' }),
    });
    assert.equal(renamed.status, 200);
    await setStatus(draft.id, 'published');
    const locked = await api.request(`${API}/admin/blog/posts/${draft.id}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: postBody(categoryId, { slug: 'a-different-slug' }),
    });
    assert.equal(locked.status, 409);
    assert.equal((await stored(draft.id))?.slug, 'a-new-draft-slug');
  });

  it('a duplicate slug is a 409', async () => {
    const first = await createDraft({ slug: 'unique-slug-test' });
    const second = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie: editorCookie,
      body: postBody(categoryId, { slug: first.slug }),
    });
    assert.equal(second.status, 409);
  });

  it('only drafts and archived posts can be deleted: a live or unpublished post must be archived first', async () => {
    const live = await seedPost(api, categoryId, adminId, { status: 'published' });
    const taken = await seedPost(api, categoryId, adminId, { status: 'unpublished' });
    for (const post of [live, taken]) {
      const reply = await api.request(`${API}/admin/blog/posts/${post.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      });
      assert.equal(reply.status, 409);
      assert.ok(await stored(post.id), 'the post still exists');
    }
    for (const status of ['draft', 'archived'] as const) {
      const post = await seedPost(api, categoryId, adminId, { status });
      const reply = await api.request(`${API}/admin/blog/posts/${post.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      });
      assert.equal(reply.status, 200);
      assert.equal(await stored(post.id), null);
    }
  });

  it('an archived post cannot be edited until it is restored', async () => {
    const post = await seedPost(api, categoryId, adminId, { status: 'archived' });
    const reply = await api.request(`${API}/admin/blog/posts/${post.id}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: postBody(categoryId, { slug: post.slug }),
    });
    assert.equal(reply.status, 409);
  });

  it('a category that does not exist is refused, and a category that still has posts cannot be deleted', async () => {
    const missing = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie: editorCookie,
      body: postBody('507f1f77bcf86cd799439099'),
    });
    assert.ok([400, 404].includes(missing.status), String(missing.status));

    const busy = await api.seedCategory('Busy Category', 3);
    await seedPost(api, String(busy.id), adminId);
    const del = await api.request(`${API}/admin/blog/categories/${busy.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    });
    assert.equal(del.status, 409);
    assert.ok(await api.models.BlogCategory.exists({ _id: busy.id }));
  });
});

describe('XSS: hostile markdown through the real renderer', () => {
  const PAYLOADS: [string, string][] = [
    ['a script tag', 'Before <script>alert(1)</script> after, long enough.'],
    ['an img onerror handler', 'Text <img src=x onerror=alert(1)> more text here.'],
    ['an svg onload handler', 'Text <svg onload=alert(1)> more text here to pass.'],
    ['an iframe', 'Text <iframe src="https://evil.example"></iframe> more text.'],
    ['a javascript: link', '[click me](javascript:alert(1)) and some more text.'],
    ['a mixed-case javascript: link', '[click me](JaVaScRiPt:alert(1)) and some more text.'],
    ['a javascript: link with an embedded tab', '[click me](java\tscript:alert(1)) and more.'],
    [
      'an entity-obfuscated javascript: link',
      '[click me](&#106;avascript:alert(1)) and some text.',
    ],
    [
      'a data: URL link',
      '[click me](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==) and text.',
    ],
    ['a vbscript: link', '[click me](vbscript:msgbox(1)) and some more text here.'],
    [
      'a raw anchor with a javascript: href',
      'Text <a href="javascript:alert(1)">x</a> and some more text.',
    ],
    [
      'an attribute breakout in link text',
      '[x" onmouseover="alert(1)](https://example.com) and more text.',
    ],
    [
      'an attribute breakout in a URL',
      '[x](https://example.com/"onmouseover="alert(1)) and more text.',
    ],
    ['an image with a javascript: source', '![x](javascript:alert(1)) and some more text here.'],
    [
      'a style attribute injection',
      '<p style="position:fixed;top:0">x</p> and some more text here.',
    ],
    ['bold wrapping a handler', '**<b onmouseover=alert(1)>hover</b>** and some more text.'],
    [
      'a code fence containing markup (must be text)',
      '```html\n<script>alert(1)</script>\n```\nand some more text here.',
    ],
    [
      'inline code containing markup (must be text)',
      'Use `<img src=x onerror=alert(1)>` here and more text.',
    ],
    [
      'a heading that carries markup',
      '## <img src=x onerror=alert(1)> Heading\n\nand some more text here.',
    ],
    ['an HTML comment', 'Text <!-- <script>alert(1)</script> --> and some more text.'],
    ['a closing-tag breakout attempt', '</p><script>alert(1)</script><p> and some more text here.'],
    ['a template/CDATA trick', 'Text <![CDATA[<script>alert(1)</script>]]> and more text here.'],
  ];

  for (const [label, markdown] of PAYLOADS) {
    it(`renders ${label} inert`, async () => {
      const draft = await createDraft({ contentMarkdown: markdown });
      const html = (await stored(draft.id))?.contentHtml ?? '';

      assert.equal(findUnsafeArticleHtml(html), null, `stored HTML failed the allow-list: ${html}`);
      assert.doesNotMatch(
        html,
        /<\s*(script|iframe|img|svg|style|object|embed|link|meta|base|form|input|button)\b/i,
        html,
      );
      assert.doesNotMatch(html, /<[^>]*\s(on[a-z]+|style|srcdoc|formaction)\s*=/i, html);
      assert.doesNotMatch(html, /href\s*=\s*"\s*(javascript|data|vbscript):/i, html);
      assert.doesNotMatch(html, /<!--/, html);
    });
  }

  it('escapes rather than drops: the script payload is still readable as text', async () => {
    const draft = await createDraft({
      contentMarkdown: 'Before <script>alert(1)</script> after, long enough.',
    });
    const html = (await stored(draft.id))?.contentHtml ?? '';
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  });

  it('a safe link and normal formatting still render (so "inert" is not just "everything stripped")', async () => {
    const draft = await createDraft({
      contentMarkdown:
        '## A heading\n\nSome **bold** and *italic* text with a [safe link](https://example.com/page?a=1&b=2).\n\n- one\n- two\n\n`code`',
    });
    const html = (await stored(draft.id))?.contentHtml ?? '';
    assert.match(html, /<h2 id="a-heading">A heading<\/h2>/);
    assert.match(html, /<strong>bold<\/strong>/);
    assert.match(html, /<em>italic<\/em>/);
    assert.match(
      html,
      /<a href="https:\/\/example\.com\/page\?a=1&amp;b=2" rel="noopener noreferrer">safe link<\/a>/,
    );
    assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
    assert.equal(findUnsafeArticleHtml(html), null);
  });

  it('a client-supplied contentHtml is ignored: the stored HTML always comes from the renderer', async () => {
    const reply = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie: editorCookie,
      body: { ...postBody(categoryId), contentHtml: '<script>alert("client html")</script>' },
    });
    assert.equal(reply.status, 201);
    const html = (await stored(reply.body.data.post.id))?.contentHtml ?? '';
    assert.doesNotMatch(html, /client html/);
  });

  it('updating a post re-renders its HTML (an edit cannot smuggle in old or client HTML)', async () => {
    const draft = await createDraft({
      contentMarkdown: 'Original harmless body that is long enough.',
    });
    const edit = await api.request(`${API}/admin/blog/posts/${draft.id}`, {
      method: 'PATCH',
      cookie: editorCookie,
      body: postBody(categoryId, {
        slug: draft.slug,
        contentMarkdown: 'New body <img src=x onerror=alert(1)> long enough.',
      }),
    });
    assert.equal(edit.status, 200);
    const html = (await stored(draft.id))?.contentHtml ?? '';
    assert.doesNotMatch(html, /Original harmless/);
    assert.equal(findUnsafeArticleHtml(html), null);
    assert.doesNotMatch(html, /<img/i);
  });

  it('a post body over the limit is a 400', async () => {
    const reply = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie: editorCookie,
      body: postBody(categoryId, { contentMarkdown: 'x'.repeat(50_001) }),
    });
    assert.ok([400, 413].includes(reply.status), String(reply.status));
  });
});
