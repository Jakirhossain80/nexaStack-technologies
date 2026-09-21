import assert from 'node:assert/strict';

import type { ZodType, output } from 'zod';

/** Every validation message a schema produces for `input`, keyed by dotted field path (`''` = the root). */
export function issuesByPath(schema: ZodType, input: unknown): Record<string, string[]> {
  const result = schema.safeParse(input);
  assert.equal(result.success, false, 'expected the input to be rejected');
  const byPath: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.map(String).join('.');
    (byPath[key] ??= []).push(issue.message);
  }
  return byPath;
}

/** Parse `input`, failing the test with the schema's own messages if it is rejected. */
export function parseValid<S extends ZodType>(schema: S, input: unknown): output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    assert.fail(`expected the input to be accepted, but: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}
