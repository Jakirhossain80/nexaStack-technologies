import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ROLES, hasAnyPermission, hasPermission, type Permission, type Role } from '@nexastack/shared';
import type { Request, Response } from 'express';

/**
 * THE RETROFIT'S SAFETY NET. Walks every admin router and checks, route by route, that:
 *
 *   1. every route is listed below (a NEW route with no entry fails this test until someone decides who
 *      may call it, so an ungated admin route cannot be added by accident);
 *   2. every route sits behind the right kind of session guard, and (except the few public auth routes)
 *      behind an explicit permission gate, and the gate is exactly the one listed;
 *   3. for each of the three roles, the route's gates let the role through exactly when the matrix says
 *      the role holds the capability.
 *
 * It inspects the real routers (no copy of them), so it fails if a route is edited to the wrong gate.
 */

// The routers read the environment at import time (through the services they pull in).
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/dummy';
process.env.JWT_SECRET = 'x'.repeat(40);
process.env.WEB_APP_URL = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';

const { adminRouter } = await import('./admin.routes.js');
const { adminBlogRouter } = await import('./adminBlog.routes.js');
const { adminEnquiriesRouter } = await import('./adminEnquiries.routes.js');
const { adminMediaRouter } = await import('./adminMedia.routes.js');
const { adminQuotationsRouter } = await import('./adminQuotations.routes.js');
const { adminUsersRouter } = await import('./adminUsers.routes.js');
const { authRouter } = await import('./auth.routes.js');
const { requireSession, requireSessionAllowingPasswordChange } = await import('../middleware/requireSession.js');

type Gate = { requiredPermissions: readonly Permission[]; mode: 'all' | 'any' };
type Handler = ((...args: never[]) => unknown) & Partial<Gate>;
type Layer = { handle: Handler; route?: { path: string; methods: Record<string, boolean>; stack: { handle: Handler }[] } };

/** How a route is expected to be protected. */
type Session = 'default' | 'password-change-allowed' | 'none';
interface Expectation {
  session: Session;
  /** The permission gates, all of which must pass. `any` gates are written as `{ any: [...] }`. */
  gates: readonly (Permission | { any: readonly Permission[] })[];
}

const gate = (...permissions: Permission[]): Expectation => ({ session: 'default', gates: permissions });
const PUBLIC: Expectation = { session: 'none', gates: [] };
const SESSION_ONLY: Expectation = { session: 'password-change-allowed', gates: [] };

const EXPECTED: Record<string, Record<string, Expectation>> = {
  auth: {
    'POST /login': PUBLIC,
    'POST /password-reset/request': PUBLIC,
    'POST /password-reset/confirm': PUBLIC,
    'POST /logout': SESSION_ONLY,
    'GET /session': SESSION_ONLY,
    'POST /change-password': SESSION_ONLY,
    'GET /activity': gate('audit:view'),
  },
  dashboard: {
    'GET /dashboard/stats': { session: 'default', gates: [{ any: ['manage:enquiries', 'manage:quotations'] }] },
    'GET /activity/recent': gate('audit:view'),
  },
  enquiries: Object.fromEntries(
    ['GET /', 'GET /export', 'GET /:id', 'PATCH /:id/status', 'POST /:id/notes', 'PATCH /:id/archive', 'PATCH /:id/unarchive'].map(
      (route) => [route, gate('manage:enquiries')],
    ),
  ),
  quotations: Object.fromEntries(
    [
      'GET /',
      'GET /export',
      'GET /:id',
      'GET /:id/attachments/:attachmentId',
      'PATCH /:id/status',
      'POST /:id/notes',
      'PATCH /:id/archive',
      'PATCH /:id/unarchive',
    ].map((route) => [route, gate('manage:quotations')]),
  ),
  media: {
    'GET /': gate('media:read'),
    'GET /:id': gate('media:read'),
    'GET /:id/usage': gate('media:read'),
    'POST /': gate('manage:media'),
    'PATCH /:id': gate('manage:media'),
    'POST /:id/replace': gate('manage:media'),
    'DELETE /:id': gate('media:delete'),
  },
  blog: {
    'GET /posts': gate('content:edit'),
    'GET /posts/:id': gate('content:edit'),
    'POST /posts': gate('content:create'),
    'PATCH /posts/:id': gate('content:edit'),
    'DELETE /posts/:id': gate('content:delete'),
    'POST /posts/:id/status': gate('content:publish'),
    'GET /categories': gate('content:edit'),
    'POST /categories': gate('content:create'),
    'PUT /categories/order': gate('content:publish'),
    'PATCH /categories/:id': gate('content:publish'),
    'DELETE /categories/:id': gate('content:delete'),
  },
  users: Object.fromEntries(
    ['GET /', 'POST /', 'PATCH /:id/role', 'PATCH /:id/status', 'POST /:id/reset-password'].map((route) => [
      route,
      gate('manage:admins'),
    ]),
  ),
};

const ROUTERS: Record<string, unknown> = {
  auth: authRouter,
  dashboard: adminRouter,
  enquiries: adminEnquiriesRouter,
  quotations: adminQuotationsRouter,
  media: adminMediaRouter,
  blog: adminBlogRouter,
  users: adminUsersRouter,
};

interface Discovered {
  key: string;
  session: Session;
  gates: Gate[];
}

/** Every route of a router, with the session guard and permission gates that apply to it. */
function discover(router: unknown): Discovered[] {
  const stack = (router as { stack: Layer[] }).stack;
  const found: Discovered[] = [];

  stack.forEach((layer, index) => {
    if (!layer.route) return;
    // Router-level `use(...)` layers registered BEFORE this route apply to it.
    const handlers: Handler[] = [
      ...stack.slice(0, index).filter((l) => !l.route).map((l) => l.handle),
      ...layer.route.stack.map((l) => l.handle),
    ];
    const method = Object.keys(layer.route.methods)[0]!.toUpperCase();

    let session: Session = 'none';
    if (handlers.includes(requireSession as unknown as Handler)) session = 'default';
    if (handlers.includes(requireSessionAllowingPasswordChange as unknown as Handler)) {
      session = session === 'default' ? 'default' : 'password-change-allowed';
    }

    found.push({
      key: `${method} ${layer.route.path}`,
      session,
      gates: handlers.filter((h): h is Handler & Gate => Array.isArray(h.requiredPermissions)) as unknown as Gate[],
    });
  });
  return found;
}

/** Runs the gates in order for a role, as the router would: all must call next() without an error. */
function passes(gates: readonly Gate[], role: Role): boolean {
  const req = { admin: { id: 'a', email: 'a@b.c', role, mustChangePassword: false, permissions: [] } } as unknown as Request;
  return gates.every((g) => {
    let ok = false;
    (g as unknown as (req: Request, res: Response, next: (err?: unknown) => void) => void)(req, {} as Response, (err) => {
      ok = !err;
    });
    return ok;
  });
}

function expectedPasses(expectation: Expectation, role: Role): boolean {
  return expectation.gates.every((g) =>
    typeof g === 'string' ? hasPermission(role, g) : hasAnyPermission(role, g.any),
  );
}

describe('every admin route is explicitly gated', () => {
  for (const [name, router] of Object.entries(ROUTERS)) {
    describe(name, () => {
      const discovered = discover(router);
      const expected = EXPECTED[name]!;

      it('has exactly the routes listed here (a new route must be added, and thereby decided)', () => {
        assert.deepEqual(discovered.map((d) => d.key).sort(), Object.keys(expected).sort());
      });

      for (const route of discovered) {
        const want = expected[route.key];
        if (!want) continue;

        it(`${route.key}: session guard and permission gate are the expected ones`, () => {
          assert.equal(route.session, want.session, 'session guard');
          assert.equal(route.gates.length, want.gates.length, `${route.gates.length} gate(s) found, ${want.gates.length} expected`);

          const expectedSpecs = want.gates
            .map((g) => (typeof g === 'string' ? { mode: 'all', permissions: [g] } : { mode: 'any', permissions: [...g.any] }))
            .map((s) => JSON.stringify({ mode: s.mode, permissions: [...s.permissions].sort() }))
            .sort();
          const actualSpecs = route.gates
            .map((g) => JSON.stringify({ mode: g.mode, permissions: [...g.requiredPermissions].sort() }))
            .sort();
          assert.deepEqual(actualSpecs, expectedSpecs);
        });

        it(`${route.key}: lets each role through exactly as the matrix says`, () => {
          for (const role of ROLES) {
            assert.equal(passes(route.gates, role), expectedPasses(want, role), `${role} on ${route.key}`);
          }
        });
      }
    });
  }

  it('no admin route is left with a permission gate that a content editor could pass but should not', () => {
    // Every route a content_editor may call, spelled out: nothing else may open to them.
    const allowedToEditor = new Set([
      'media GET /',
      'media GET /:id',
      'media GET /:id/usage',
      'blog GET /posts',
      'blog GET /posts/:id',
      'blog POST /posts',
      'blog PATCH /posts/:id',
      'blog GET /categories',
      'blog POST /categories',
      'auth POST /login',
      'auth POST /logout',
      'auth GET /session',
      'auth POST /change-password',
      'auth POST /password-reset/request',
      'auth POST /password-reset/confirm',
    ]);
    const actual = new Set<string>();
    for (const [name, router] of Object.entries(ROUTERS)) {
      for (const route of discover(router)) {
        if (passes(route.gates, 'content_editor')) actual.add(`${name} ${route.key}`);
      }
    }
    assert.deepEqual([...actual].sort(), [...allowedToEditor].sort());
  });

  it('only a super_admin can reach the account-management routes', () => {
    for (const route of discover(adminUsersRouter)) {
      assert.equal(passes(route.gates, 'super_admin'), true, route.key);
      assert.equal(passes(route.gates, 'admin'), false, `${route.key} must refuse admin`);
      assert.equal(passes(route.gates, 'content_editor'), false, `${route.key} must refuse content_editor`);
    }
  });

  it('the forced-password-change guard is the DEFAULT: only session/logout/change-password bypass it', () => {
    const bypass = new Set<string>();
    for (const [name, router] of Object.entries(ROUTERS)) {
      for (const route of discover(router)) {
        if (route.session === 'password-change-allowed') bypass.add(`${name} ${route.key}`);
      }
    }
    assert.deepEqual([...bypass].sort(), ['auth GET /session', 'auth POST /change-password', 'auth POST /logout']);
  });
});
