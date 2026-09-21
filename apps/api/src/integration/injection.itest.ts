import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import {
  postBody,
  seedEnquiry,
  seedMedia,
  seedPost,
  seedQuotation,
  snapshot,
} from './support/fixtures.js';
import { API, startApi, type Api } from './support/harness.js';

/**
 * NoSQL injection and mass assignment, tested the way the Security task proved them by hand: operator
 * objects and regex metacharacters in search/filter parameters and JSON bodies must never widen a query,
 * become a pattern, or reach the database as an operator; and a client must not be able to set fields the
 * server owns.
 */

let api: Api;
let cookie: string;
let adminId: string;
let categoryId: string;

before(async () => {
  api = await startApi();
  const admin = await api.seedAdmin('super_admin');
  adminId = admin.id;
  cookie = await api.loginAs(admin);
  categoryId = String((await api.seedCategory()).id);

  await seedEnquiry(api, { subject: 'Alpha enquiry', status: 'new' });
  await seedEnquiry(api, { subject: 'Beta enquiry', status: 'read' });
  await seedEnquiry(api, { subject: 'Gamma enquiry', status: 'closed' });
  await seedEnquiry(api, { subject: `${'a'.repeat(40)}!`, status: 'new' });
  await seedQuotation(api, { fullName: 'Alpha Quote' });
  await seedQuotation(api, { fullName: 'Beta Quote' });
  await seedPost(api, categoryId, adminId, { title: 'Alpha post', status: 'published' });
  await seedPost(api, categoryId, adminId, { title: 'Beta post' });
  await seedMedia(api, adminId, { filename: 'alpha.png' });
  await seedMedia(api, adminId, { filename: 'beta.png' });
});

after(async () => {
  await api.stop();
});

const get = (path: string) => api.request(`${API}${path}`, { cookie });
const total = (reply: { body: { data?: { total?: number; pagination?: { total?: number } } } }) =>
  reply.body.data?.total ?? reply.body.data?.pagination?.total;

/** Every admin list endpoint that takes free-text search: (label, path prefix, total when unfiltered). */
const LISTS: [string, string][] = [
  ['enquiries', '/admin/enquiries'],
  ['quotations', '/admin/quotations'],
  ['blog posts', '/admin/blog/posts'],
  ['media', '/admin/media'],
];

describe('search text is matched LITERALLY, never as a pattern', () => {
  for (const [label, path] of LISTS) {
    describe(label, () => {
      // A lone "." is deliberately absent: it is matched as a literal dot, and the synthetic fixtures (emails,
      // sentences) legitimately contain dots. Every string below occurs in none of them.
      it('"*" ".*" "^" "$" "[a-z]+" and friends match nothing (they are not wildcards)', async () => {
        for (const q of ['*', '.*', '^', '$', '[a-z]+', '\\w+', '|', 'a|b', '^A', 'e$']) {
          const reply = await get(`${path}?q=${encodeURIComponent(q)}`);
          assert.equal(reply.status, 200, `q=${q}`);
          assert.equal(total(reply), 0, `${label}: q=${q} must not act as a regex`);
        }
      });

      it('a syntactically INVALID regex ("(", "[", "\\") is harmless text, not a 500', async () => {
        for (const q of ['(', '[', '\\', '(?<', '*+', ')']) {
          const reply = await get(`${path}?q=${encodeURIComponent(q)}`);
          assert.equal(reply.status, 200, `q=${q} -> ${reply.status} ${reply.text.slice(0, 120)}`);
        }
      });

      it('a real term still finds its row (so the zeros above are not a broken search)', async () => {
        const reply = await get(`${path}?q=alpha`);
        assert.equal(reply.status, 200);
        assert.ok((total(reply) ?? 0) >= 1, `${label}: "alpha" must match something`);
      });

      it('search text over 100 characters is rejected with 400, not run', async () => {
        const reply = await get(`${path}?q=${'a'.repeat(101)}`);
        assert.equal(reply.status, 400);
        assert.equal(reply.body.error?.code, 'VALIDATION_ERROR');
      });
    });
  }

  it('a catastrophic-backtracking pattern returns at once (a ReDoS attempt against the enquiry search)', async () => {
    const started = Date.now();
    const reply = await get(`/admin/enquiries?q=${encodeURIComponent('(a+)+$')}`);
    assert.equal(reply.status, 200);
    assert.equal(total(reply), 0);
    assert.ok(Date.now() - started < 3000, `took ${Date.now() - started}ms`);
  });
});

describe('operator syntax in the query string never widens or changes a query', () => {
  it('status[$ne]=... and other bracketed operators are ignored: the result equals the unfiltered list, never an error', async () => {
    const ids = (reply: { body: { data?: { items?: { id: string }[] } } }) =>
      (reply.body.data?.items ?? []).map((row) => row.id);
    const plain = await get('/admin/enquiries?archived=false');
    assert.equal(plain.status, 200);
    assert.ok(
      ids(plain).length >= 4,
      'the fixtures must be visible, or the comparison below proves nothing',
    );
    for (const suffix of [
      'status[$ne]=closed',
      'status[$gt]=',
      'q[$regex]=.*',
      'archived[$ne]=true',
      '$where=1',
      'status[$in][]=new',
    ]) {
      const reply = await get(`/admin/enquiries?${suffix}`);
      assert.equal(reply.status, 200, suffix);
      assert.deepEqual(ids(reply), ids(plain), `${suffix} must behave as if absent`);
    }
  });

  it('a status value that is not one of the real statuses is a 400 (validated, not passed to the query)', async () => {
    for (const status of ['$ne', 'new,$ne', '{"$ne":"x"}', 'nope', 'new;drop']) {
      const reply = await get(`/admin/enquiries?status=${encodeURIComponent(status)}`);
      assert.equal(reply.status, 400, status);
    }
    assert.equal((await get('/admin/quotations?status=%24ne')).status, 400);
    assert.equal((await get('/admin/blog/posts?status=%24ne')).status, 400);
  });

  it('pagination that is not a plain positive integer is a 400', async () => {
    for (const query of [
      'page=0',
      'page=-1',
      'page=1.5',
      'page=abc',
      'limit=0',
      'limit=101',
      'limit=1e9',
      'page[$gt]=0x',
    ]) {
      const reply = await get(`/admin/enquiries?${query}`);
      assert.ok([200, 400].includes(reply.status), `${query} -> ${reply.status}`);
      if (!query.includes('[')) assert.equal(reply.status, 400, query);
    }
  });

  it('a blog category filter that is not a slug is a 400', async () => {
    assert.equal(
      (await get(`/admin/blog/posts?category=${encodeURIComponent('{"$ne":null}')}`)).status,
      400,
    );
  });
});

describe('operator objects in path parameters and JSON bodies are refused, and nothing is written', () => {
  it('an id that is not a 24-character hex ObjectId is 400 on every :id route', async () => {
    for (const id of [
      '%7B%22%24ne%22%3Anull%7D',
      '..%2F..%2Fetc%2Fpasswd',
      '123',
      'g'.repeat(24),
      '%24ne',
    ]) {
      for (const path of [
        `/admin/enquiries/${id}`,
        `/admin/quotations/${id}`,
        `/admin/blog/posts/${id}`,
        `/admin/media/${id}`,
      ]) {
        const reply = await get(path);
        assert.equal(reply.status, 400, `${path} -> ${reply.status}`);
      }
    }
  });

  it('a status change with an operator object, an array or a wrong type is 400 and changes nothing', async () => {
    const enquiry = await seedEnquiry(api);
    const before = await snapshot(api);
    for (const body of [
      { status: { $ne: 'new' } },
      { status: ['closed'] },
      { status: 1 },
      { status: null },
      {},
      { $set: { status: 'closed' } },
    ]) {
      const reply = await api.request(`${API}/admin/enquiries/${enquiry.id}/status`, {
        method: 'PATCH',
        cookie,
        body,
      });
      assert.equal(reply.status, 400, JSON.stringify(body));
    }
    assert.equal(await snapshot(api), before);
  });

  it('a note whose text is an object is 400', async () => {
    const enquiry = await seedEnquiry(api);
    const reply = await api.request(`${API}/admin/enquiries/${enquiry.id}/notes`, {
      method: 'POST',
      cookie,
      body: { text: { $gt: '' } },
    });
    assert.equal(reply.status, 400);
  });

  it('a blog post whose category is an operator object is 400 and creates nothing', async () => {
    const before = await snapshot(api);
    const reply = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie,
      body: postBody(categoryId, { categoryId: { $ne: null } }),
    });
    assert.equal(reply.status, 400);
    assert.equal(await snapshot(api), before);
  });
});

describe('mass assignment: a client cannot set fields the server owns', () => {
  it('blog create ignores status, publishedAt, contentHtml, createdBy, updatedBy and slug-locking fields', async () => {
    const other = await api.seedAdmin('admin');
    const reply = await api.request(`${API}/admin/blog/posts`, {
      method: 'POST',
      cookie,
      body: {
        ...postBody(categoryId),
        status: 'published',
        publishedAt: '2001-01-01T00:00:00.000Z',
        contentHtml: '<script>alert(1)</script>',
        createdBy: other.id,
        updatedBy: other.id,
        _id: '507f1f77bcf86cd799439011',
      },
    });
    assert.equal(reply.status, 201);
    const stored = await api.models.BlogPost.findById(reply.body.data.post.id).lean();
    assert.ok(stored);
    assert.equal(stored.status, 'draft', 'a new post is always a draft');
    assert.equal(stored.publishedAt, null);
    assert.doesNotMatch(stored.contentHtml, /<script/i);
    assert.equal(
      String(stored.createdBy),
      adminId,
      'the author is the signed-in admin, not a client-supplied id',
    );
    assert.notEqual(String(stored._id), '507f1f77bcf86cd799439011');
  });

  it('creating an admin account ignores a client-supplied password, hash, status and mustChangePassword', async () => {
    const reply = await api.request(`${API}/admin/users`, {
      method: 'POST',
      cookie,
      body: {
        email: 'test-mass-assign@example.com',
        role: 'content_editor',
        password: 'Client-Chosen-1',
        passwordHash: 'not-a-real-hash',
        status: 'suspended',
        mustChangePassword: false,
      },
    });
    assert.equal(reply.status, 201);
    const stored = await api.models.AdminUser.findOne({ email: 'test-mass-assign@example.com' })
      .select('+passwordHash')
      .lean();
    assert.ok(stored);
    assert.equal(stored.status, 'active');
    assert.equal(
      stored.mustChangePassword,
      true,
      'a new account always starts on a temporary password',
    );
    assert.notEqual(stored.passwordHash, 'not-a-real-hash');
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/, 'a bcrypt hash at cost 12');
    const login = await api.request(`${API}/auth/login`, {
      method: 'POST',
      body: { email: 'test-mass-assign@example.com', password: 'Client-Chosen-1' },
    });
    assert.equal(login.status, 401, 'the client-chosen password does not work');
  });

  it('a note cannot set its own author or timestamp', async () => {
    const enquiry = await seedEnquiry(api);
    const other = await api.seedAdmin('admin');
    const reply = await api.request(`${API}/admin/enquiries/${enquiry.id}/notes`, {
      method: 'POST',
      cookie,
      body: {
        text: 'A synthetic note.',
        authorAdminId: other.id,
        createdAt: '2001-01-01T00:00:00.000Z',
      },
    });
    assert.equal(reply.status, 201);
    const stored = await api.models.ContactSubmission.findById(enquiry.id).lean();
    assert.equal(String(stored?.notes[0]?.authorAdminId), adminId);
    assert.ok((stored?.notes[0]?.createdAt.getFullYear() ?? 0) >= 2026);
  });
});

describe('errors never leak internals', () => {
  it('a database failure is answered with a generic 500: no driver message, connection string, stack or path', async () => {
    const secret =
      'MongoServerError: connect ECONNREFUSED mongodb://leak-user:leak-pass@internal-host:27017/prod at /srv/app/secret.js:1:1';
    const original = api.models.ContactSubmission.countDocuments;
    (api.models.ContactSubmission as unknown as { countDocuments: () => never }).countDocuments =
      () => {
        throw new Error(secret);
      };
    try {
      const reply = await get('/admin/enquiries');
      assert.equal(reply.status, 500);
      assert.equal(reply.body.success, false);
      assert.equal(reply.body.error?.code, 'INTERNAL_ERROR');
      for (const leaked of [
        'leak-user',
        'leak-pass',
        'internal-host',
        'MongoServerError',
        'ECONNREFUSED',
        'secret.js',
        'stack',
        '    at ',
      ]) {
        assert.ok(!reply.text.includes(leaked), `the response leaked "${leaked}"`);
      }
    } finally {
      (api.models.ContactSubmission as unknown as { countDocuments: unknown }).countDocuments =
        original;
    }
  });
});
