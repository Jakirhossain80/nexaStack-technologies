import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { describeUsageBlock } from './mediaUsage.service.js';

const post = (n: number, status = 'published') => ({ id: `id${n}`, title: `Post ${n}`, status });

describe('describeUsageBlock (the certain refusal to delete an image that posts use)', () => {
  it('names the post and its status, and says what to do and that nothing was deleted', () => {
    const message = describeUsageBlock({ blogPosts: [post(1, 'draft')] });
    assert.match(message, /cover image of 1 blog post: “Post 1” \(draft\)/);
    assert.match(message, /Change or remove its cover first/);
    assert.match(message, /Nothing was deleted\./);
  });

  it('uses plural wording for several posts', () => {
    const message = describeUsageBlock({ blogPosts: [post(1), post(2)] });
    assert.match(message, /cover image of 2 blog posts:/);
    assert.match(message, /Change or remove their cover first/);
  });

  it('lists at most five posts and counts the rest', () => {
    const message = describeUsageBlock({ blogPosts: Array.from({ length: 8 }, (_, i) => post(i + 1)) });
    assert.match(message, /Post 5/);
    assert.equal(message.includes('Post 6'), false);
    assert.match(message, /and 3 more\./);
  });

  it('states a certainty (a real reference), not a best-effort hint', () => {
    const message = describeUsageBlock({ blogPosts: [post(1)] });
    assert.equal(/might|may|possible|best-effort/i.test(message), false);
  });
});
