import test, { beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

// Match CI's Node version and avoid requiring a generated Prisma client.
if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('Auth.js credential and callback unit tests', () => {
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--import', 'tsx', fileURLToPath(import.meta.url),
    ], { encoding: 'utf8', timeout: 30_000, env: { ...process.env, NODE_NO_WARNINGS: '1' } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
  });
} else {
  const findUnique = mock.fn(async (_args: unknown): Promise<any> => null);
  const consume = mock.fn(async (..._args: unknown[]) => true);
  let config: any;
  mock.module(new URL('../src/lib/prisma.ts', import.meta.url), { namedExports: { prisma: { user: { findUnique } } } });
  mock.module(new URL('../src/lib/rate-limit.ts', import.meta.url), { namedExports: { consumeAuthRateLimit: consume } });
  mock.module('next-auth', { defaultExport: (options: unknown) => { config = options; return {}; } });
  mock.module('@auth/prisma-adapter', { namedExports: { PrismaAdapter: () => ({}) } });
  await import('../src/auth');
  const authorize = config.providers.find((provider: any) => provider.id === 'credentials').options.authorize;
  const request = new Request('https://app.example.test/api/auth/callback/credentials');
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const user = {
    id: 'user-1', email: 'user@example.test', name: 'User', image: null, passwordHash,
    createdAt: new Date('2026-01-01T00:00:00Z'), emailVerified: new Date('2026-01-02T00:00:00Z'),
  };
  beforeEach(() => {
    findUnique.mock.resetCalls();
    findUnique.mock.mockImplementation(async () => user);
    consume.mock.resetCalls();
    consume.mock.mockImplementation(async () => true);
  });

  test('credential authorization normalizes email and returns verified session fields', async () => {
    const result = await authorize({ email: ' User@Example.test ', password: 'correct-password' }, request);
    assert.deepEqual(findUnique.mock.calls[0].arguments[0], { where: { email: 'user@example.test' } });
    assert.deepEqual(consume.mock.calls[0].arguments, [request, 'login', 10, 15 * 60 * 1000]);
    assert.deepEqual(result, {
      id: 'user-1', email: 'user@example.test', name: 'User', image: null,
      createdAt: '2026-01-01T00:00:00.000Z', emailVerifiedAt: '2026-01-02T00:00:00.000Z',
    });
  });

  test('credential authorization rejects rate-limited and incomplete requests before querying users', async () => {
    consume.mock.mockImplementation(async () => false);
    assert.equal(await authorize({ email: user.email, password: 'correct-password' }, request), null);
    consume.mock.mockImplementation(async () => true);
    assert.equal(await authorize({ email: ' ', password: 'correct-password' }, request), null);
    assert.equal(await authorize({ email: user.email, password: '' }, request), null);
    assert.equal(await authorize(undefined, request), null);
    assert.equal(findUnique.mock.callCount(), 0);
  });

  test('credential authorization rejects absent, unverified, passwordless and incorrect-password accounts', async () => {
    for (const account of [null, { ...user, emailVerified: null }, { ...user, passwordHash: null }]) {
      findUnique.mock.mockImplementation(async () => account);
      assert.equal(await authorize({ email: user.email, password: 'correct-password' }, request), null);
    }
    findUnique.mock.mockImplementation(async () => user);
    assert.equal(await authorize({ email: user.email, password: 'wrong-password' }, request), null);
  });

  test('JWT callback serializes credential and OAuth date fields', async () => {
    const token = await config.callbacks.jwt({ token: { sub: 'user-1' }, user });
    assert.equal(token.createdAt, '2026-01-01T00:00:00.000Z');
    assert.equal(token.emailVerifiedAt, '2026-01-02T00:00:00.000Z');
    const credentialToken = await config.callbacks.jwt({ token: {}, user: { createdAt: 'created', emailVerifiedAt: 'verified' } });
    assert.deepEqual(credentialToken, { createdAt: 'created', emailVerifiedAt: 'verified' });
    const oauthToken = await config.callbacks.jwt({ token: {}, user: { createdAt: user.createdAt, emailVerified: 'verified-string' } });
    assert.equal(oauthToken.emailVerifiedAt, 'verified-string');
    const existing = { sub: 'user-1', createdAt: 'unchanged' };
    assert.equal(await config.callbacks.jwt({ token: existing }), existing);
    assert.equal(existing.createdAt, 'unchanged');
  });

  test('session callback maps token fields only when a user and subject exist', async () => {
    const session = { user: { name: 'User' } };
    const result = await config.callbacks.session({ session, token: { sub: 'user-1', createdAt: 'created', emailVerifiedAt: 'verified' } });
    assert.deepEqual(result.user, { name: 'User', id: 'user-1', createdAt: 'created', emailVerifiedAt: 'verified' });
    const missingSubject = { user: { name: 'User' } };
    assert.deepEqual(await config.callbacks.session({ session: missingSubject, token: {} }), missingSubject);
    const wrongTypes = await config.callbacks.session({ session: { user: {} }, token: { sub: 'user-1', createdAt: 12, emailVerifiedAt: null } });
    assert.equal(wrongTypes.user.createdAt, undefined);
    assert.equal(wrongTypes.user.emailVerifiedAt, undefined);
  });
}
