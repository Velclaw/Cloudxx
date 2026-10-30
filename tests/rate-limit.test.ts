import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

let attempts: number | undefined = 1;
const queries: unknown[][] = [];
let cleanupCalls = 0;
let failCleanup = false;
const prisma = {
  async $queryRaw(_strings: TemplateStringsArray, ...values: unknown[]) {
    queries.push(values);
    return attempts === undefined ? [] : [{ attempts }];
  },
  async $executeRaw(_strings: TemplateStringsArray, ..._values: unknown[]) {
    cleanupCalls++;
    if (failCleanup) throw new Error('cleanup failed');
  },
};
(globalThis as unknown as { prisma: unknown }).prisma = prisma;
const { consumeAuthRateLimit } = await import('../src/lib/rate-limit');

function request(headers: Record<string, string> = {}) {
  return { headers: new Headers(headers) };
}

test('allows attempts through the limit and denies excess or missing database results', async t => {
  t.mock.method(Math, 'random', () => 1);
  attempts = 5;
  assert.equal(await consumeAuthRateLimit(request(), 'login', 5, 900_000), true);
  attempts = 6;
  assert.equal(await consumeAuthRateLimit(request(), 'login', 5, 900_000), false);
  attempts = undefined;
  assert.equal(await consumeAuthRateLimit(request(), 'login', 5, 900_000), false);
});

test('keys limits by scope and trusted real IP, ignoring forwarded IP', async t => {
  t.mock.method(Math, 'random', () => 1);
  attempts = 1;
  queries.length = 0;
  await consumeAuthRateLimit(request({ 'x-real-ip': '203.0.113.4', 'x-forwarded-for': '192.0.2.1' }), 'login', 5, 900_000);
  await consumeAuthRateLimit(request({ 'x-forwarded-for': '192.0.2.2' }), 'register', 5, 900_000);
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  assert.equal(queries[0][0], hash('login:203.0.113.4'));
  assert.equal(queries[1][0], hash('register:unknown'));
  const now = queries[0][1] as Date;
  const expiredBefore = queries[0][3] as Date;
  assert.equal(now.getTime() - expiredBefore.getTime(), 900_000);
});

test('cleanup is sampled and failures do not block authentication', async t => {
  attempts = 1;
  cleanupCalls = 0;
  failCleanup = true;
  t.mock.method(Math, 'random', () => 0);
  assert.equal(await consumeAuthRateLimit(request(), 'login', 5, 900_000), true);
  assert.equal(cleanupCalls, 1);
  failCleanup = false;
});
