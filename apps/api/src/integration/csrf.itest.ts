import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { postBody, seedEnquiry, seedPost, snapshot } from './support/fixtures.js';
import {
  API,
  CSRF_HEADER,
  CSRF_VALUE,
  SESSION_COOKIE,
  TEST_ORIGIN,
  startApi,
  type Api,
  type Reply,
} from './support/harness.js';

/**
 * CSRF, tested the way the Security task proved it by hand: a cookie-authenticated mutation is refused unless
 * the request carries BOTH an allow-listed Origin and the custom header a cross-site <form> cannot set. A
 * refused request must change nothing. Also the CORS half: a foreign origin is never granted credentialed
 * access.
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
});

after(async () => {
  await api.stop();
});

interface Mutation {
  name: string;
  /** Fresh fixtures, then the request with the given CSRF-related overrides. */
  prepare: () => Promise<
    (csrf: {
      origin?: string | null;
      csrf?: boolean;
      headers?: Record<string, string>;
    }) => Promise<Reply>
  >;
}

const MUTATIONS: Mutation[] = [
  {
    name: 'create a blog post',
    prepare: async () => (o) =>
      api.request(`${API}/admin/blog/posts`, {
        method: 'POST',
        cookie,
        body: postBody(categoryId),
        ...o,
      }),
  },
  {
    name: 'publish a blog post',
    prepare: async () => {
      const post = await seedPost(api, categoryId, adminId);
      return (o) =>
        api.request(`${API}/admin/blog/posts/${post.id}/status`, {
          method: 'POST',
          cookie,
          body: { status: 'published' },
          ...o,
        });
    },
  },
  {
    name: 'delete a blog post',
    prepare: async () => {
      const post = await seedPost(api, categoryId, adminId);
      return (o) =>
        api.request(`${API}/admin/blog/posts/${post.id}`, { method: 'DELETE', cookie, ...o });
    },
  },
  {
    name: 'change an enquiry status',
    prepare: async () => {
      const enquiry = await seedEnquiry(api);
      return (o) =>
        api.request(`${API}/admin/enquiries/${enquiry.id}/status`, {
          method: 'PATCH',
          cookie,
          body: { status: 'closed' },
          ...o,
        });
    },
  },
  {
    name: 'archive an enquiry',
    prepare: async () => {
      const enquiry = await seedEnquiry(api);
      return (o) =>
        api.request(`${API}/admin/enquiries/${enquiry.id}/archive`, {
          method: 'PATCH',
          cookie,
          ...o,
        });
    },
  },
  {
    name: 'create an admin account',
    prepare: async () => (o) =>
      api.request(`${API}/admin/users`, {
        method: 'POST',
        cookie,
        body: {
          email: `test-csrf-${Math.random().toString(36).slice(2, 10)}@example.com`,
          role: 'super_admin',
        },
        ...o,
      }),
  },
  {
    name: 'change a password',
    prepare: async () => (o) =>
      api.request(`${API}/auth/change-password`, {
        method: 'POST',
        cookie,
        body: { currentPassword: 'Test-Password-1234', newPassword: 'Should-Never-Apply-1' },
        ...o,
      }),
  },
];

describe('a cookie-authenticated mutation without proof of origin is refused and changes nothing', () => {
  const attacks: [
    string,
    { origin?: string | null; csrf?: boolean; headers?: Record<string, string> },
  ][] = [
    [
      'no Origin header and no custom header (a plain cross-site form post)',
      { origin: null, csrf: false },
    ],
    ['no Origin header (custom header present)', { origin: null }],
    ['a foreign Origin (custom header present)', { origin: 'https://evil.example' }],
    ['an Origin that merely CONTAINS the allowed one', { origin: `${TEST_ORIGIN}.evil.example` }],
    ['an Origin with a different port', { origin: 'http://localhost:3001' }],
    ['the allowed Origin, but no custom header', { csrf: false }],
    [
      'the allowed Origin, but a wrong custom header value',
      { csrf: false, headers: { [CSRF_HEADER]: 'XMLHttpRequest' } },
    ],
    ['a "null" Origin (sandboxed iframe / data: URL)', { origin: 'null' }],
  ];

  for (const mutation of MUTATIONS) {
    describe(mutation.name, () => {
      for (const [label, overrides] of attacks) {
        it(`refuses ${label}: 403, nothing changed`, async () => {
          const send = await mutation.prepare();
          const before = await snapshot(api);
          const reply = await send(overrides);
          assert.equal(reply.status, 403, JSON.stringify(reply.body));
          assert.equal(reply.body.success, false);
          assert.equal(reply.body.error?.code, 'FORBIDDEN');
          assert.equal(await snapshot(api), before, 'the database must be untouched');
        });
      }

      it('accepts the same request once Origin AND the custom header are right (so the refusals above are about CSRF, not a broken fixture)', async () => {
        const send = await mutation.prepare();
        const reply = await send({});
        assert.ok(
          reply.status >= 200 && reply.status < 300,
          `${reply.status} ${JSON.stringify(reply.body)}`,
        );
      });
    });
  }
});

describe('the session cookie alone cannot be replayed cross-site', () => {
  it('a urlencoded <form> body with the cookie (what a hostile page can send) is refused before it is read', async () => {
    const before = await snapshot(api);
    const reply = await api.request(`${API}/admin/users`, {
      method: 'POST',
      cookie,
      origin: 'https://evil.example',
      csrf: false,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      rawBody: 'email=test-form@example.com&role=super_admin',
    });
    assert.equal(reply.status, 403);
    assert.equal(await snapshot(api), before);
  });

  it('logout is CSRF-protected too: a forged logout does not end the session', async () => {
    const admin = await api.seedAdmin('admin');
    const victim = await api.loginAs(admin);
    const forged = await api.request(`${API}/auth/logout`, {
      method: 'POST',
      cookie: victim,
      origin: 'https://evil.example',
      csrf: false,
    });
    assert.equal(forged.status, 403);
    assert.equal(
      (await api.request(`${API}/auth/session`, { cookie: victim })).status,
      200,
      'the session survives',
    );
  });

  it('login is CSRF-protected: a cross-site login attempt is refused (no login CSRF / session fixation)', async () => {
    const admin = await api.seedAdmin('admin');
    const reply = await api.request(`${API}/auth/login`, {
      method: 'POST',
      body: { email: admin.email, password: admin.password },
      origin: 'https://evil.example',
    });
    assert.equal(reply.status, 403);
    assert.equal(reply.setCookies.length, 0, 'no session cookie is issued to a foreign origin');
  });

  it('GET requests are not blocked by the CSRF check (it guards mutations only)', async () => {
    assert.equal((await api.request(`${API}/admin/enquiries`, { cookie })).status, 200);
  });

  it('an unauthenticated mutation with no proof of origin is 401 (authentication first), not a CSRF 403', async () => {
    const reply = await api.request(`${API}/admin/users`, {
      method: 'POST',
      origin: null,
      csrf: false,
      body: { email: 'test@example.com', role: 'admin' },
    });
    assert.equal(reply.status, 401);
  });
});

describe('CORS', () => {
  const preflight = (origin: string) =>
    api.request(`${API}/admin/users`, {
      method: 'OPTIONS',
      origin,
      headers: {
        'access-control-request-method': 'POST',
        'access-control-request-headers': `content-type,${CSRF_HEADER}`,
      },
    });

  it('an allowed origin gets credentialed access and may send the custom CSRF header', async () => {
    const reply = await preflight(TEST_ORIGIN);
    assert.equal(reply.headers.get('access-control-allow-origin'), TEST_ORIGIN);
    assert.equal(reply.headers.get('access-control-allow-credentials'), 'true');
    assert.match(
      reply.headers.get('access-control-allow-headers') ?? '',
      new RegExp(CSRF_HEADER, 'i'),
    );
  });

  it('a foreign origin is granted nothing: no Allow-Origin, no credentials', async () => {
    const reply = await preflight('https://evil.example');
    assert.equal(reply.headers.get('access-control-allow-origin'), null);
    assert.equal(reply.headers.get('access-control-allow-credentials'), null);
  });

  it('the wildcard is never used, even for a simple request', async () => {
    const reply = await api.request(`${API}/admin/enquiries`, {
      cookie,
      origin: 'https://evil.example',
    });
    assert.notEqual(reply.headers.get('access-control-allow-origin'), '*');
    assert.equal(reply.headers.get('access-control-allow-origin'), null);
  });

  it('the session cookie is HttpOnly and SameSite=Lax (defence in depth under the header check)', async () => {
    const admin = await api.seedAdmin('admin');
    const login = await api.request(`${API}/auth/login`, {
      method: 'POST',
      body: { email: admin.email, password: admin.password },
    });
    const set = login.setCookies.find((value) => value.startsWith(`${SESSION_COOKIE}=`)) ?? '';
    assert.match(set, /HttpOnly/i);
    assert.match(set, /SameSite=Lax/i);
    assert.ok(CSRF_VALUE.length > 0);
  });
});
