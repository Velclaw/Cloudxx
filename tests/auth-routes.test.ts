import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

type User = { email: string; name?: string; passwordHash: string | null; emailVerified: Date | null };
type Token = { identifier: string; token: string; expires: Date };
type Email = { to: string; subject: string; text: string; html: string };
let users: User[] = [];
let tokens: Token[] = [];
let emails: Email[] = [];
let attempts = 1;
let updates = 0;
let loseTokenRace = false;
const originalFetch = globalThis.fetch;
const originalEnv = { AUTH_URL: process.env.AUTH_URL, RESEND_API_KEY: process.env.RESEND_API_KEY, EMAIL_FROM: process.env.EMAIL_FROM };

function matches(token: Token, where: any) {
  return (!where.identifier || (typeof where.identifier === 'string'
    ? token.identifier === where.identifier
    : token.identifier.startsWith(where.identifier.startsWith))) &&
    (!where.token || token.token === where.token) &&
    (!where.expires?.gt || token.expires > where.expires.gt) &&
    (!where.expires?.lte || token.expires <= where.expires.lte);
}

const prisma = {
  async $queryRaw() { return [{ attempts }]; },
  async $executeRaw() {},
  user: {
    async findUnique({ where }: any) { return users.find(user => user.email === where.email) ?? null; },
    async create({ data }: any) { const user = { ...data, emailVerified: null }; users.push(user); return user; },
    async update({ where, data }: any) {
      const user = users.find(item => item.email === where.email);
      if (!user) throw new Error('user missing');
      Object.assign(user, data);
      updates++;
      return user;
    },
  },
  verificationToken: {
    async findFirst({ where }: any) { return tokens.find(token => matches(token, where)) ?? null; },
    async create({ data }: { data: Token }) { tokens.push(data); return data; },
    async deleteMany({ where }: any) {
      if (loseTokenRace && where.token) return { count: 0 };
      const matched = tokens.filter(token => matches(token, where));
      tokens = tokens.filter(token => !matches(token, where));
      return { count: matched.length };
    },
  },
  async $transaction<T>(operation: (tx: any) => Promise<T>): Promise<T> { return operation(prisma); },
};
(globalThis as unknown as { prisma: unknown }).prisma = prisma;
const register = await import('../src/app/api/auth/register/route');
const forgot = await import('../src/app/api/auth/forgot-password/route');
const reset = await import('../src/app/api/auth/reset-password/route');
const verify = await import('../src/app/api/auth/verify-email/route');

beforeEach(() => {
  users = [];
  tokens = [];
  emails = [];
  attempts = 1;
  updates = 0;
  loseTokenRace = false;
  process.env.AUTH_URL = 'https://cloudxx.example/base?old=1';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'sender@example.test';
  globalThis.fetch = async (_input, init) => {
    emails.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 202 });
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function json(body: unknown) {
  return new Request('https://cloudxx.example/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
function form(email: string, token: string) {
  return new Request('https://cloudxx.example/api/auth/verify-email', { method: 'POST', body: new URLSearchParams({ email, token }) });
}
function link(email: Email) {
  const match = email.text.match(/https:\/\/\S+/);
  assert.ok(match);
  return new URL(match[0]);
}
function digest(raw: string) { return createHash('sha256').update(raw).digest('hex'); }
function redirect(response: Response, status: string) {
  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get('location')!).searchParams.get('verified'), status);
}

test('registration normalizes the account, hashes the password and sends a digest-backed verification link', async () => {
  const response = await register.POST(json({ email: '  User@Example.COM ', password: 'long-enough-password', fullName: ` ${'N'.repeat(105)} ` }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(users[0].email, 'user@example.com');
  assert.equal(users[0].name?.length, 100);
  assert.notEqual(users[0].passwordHash, 'long-enough-password');
  assert.equal(await bcrypt.compare('long-enough-password', users[0].passwordHash!), true);
  assert.equal(emails.length, 1);
  const url = link(emails[0]);
  const raw = url.searchParams.get('token')!;
  assert.equal(url.pathname, '/api/auth/verify-email');
  assert.equal(url.searchParams.get('email'), 'user@example.com');
  assert.equal(url.searchParams.has('old'), false);
  assert.match(raw, /^[a-f0-9]{64}$/);
  assert.equal(tokens[0].token, digest(raw));
  assert.ok(tokens[0].expires.getTime() - Date.now() > 23 * 60 * 60 * 1000);
});

test('registration validates email and password boundaries before writing', async () => {
  for (const body of [
    { email: 'bad', password: '12345678' },
    { email: `${'a'.repeat(243)}@example.com`, password: '12345678' },
    { email: 'a@example.com', password: '1234567' },
    { email: 'a@example.com', password: 'a'.repeat(129) },
  ]) assert.equal((await register.POST(json(body))).status, 400);
  assert.deepEqual(users, []);
  assert.deepEqual(emails, []);
});

test('registration hides existing accounts and never replaces an unverified password', async () => {
  users.push({ email: 'verified@example.com', passwordHash: 'original', emailVerified: new Date() });
  users.push({ email: 'oauth@example.com', passwordHash: null, emailVerified: null });
  users.push({ email: 'pending@example.com', passwordHash: 'original', emailVerified: null });
  for (const email of ['verified@example.com', 'oauth@example.com', 'pending@example.com']) {
    assert.deepEqual(await (await register.POST(json({ email, password: 'new-password' }))).json(), { ok: true });
  }
  assert.equal(users[2].passwordHash, 'original');
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, 'pending@example.com');
});

test('forgot password does not disclose absent, unverified or OAuth-only accounts', async () => {
  users.push({ email: 'pending@example.com', passwordHash: 'hash', emailVerified: null });
  users.push({ email: 'oauth@example.com', passwordHash: null, emailVerified: new Date() });
  for (const email of ['invalid', 'missing@example.com', 'pending@example.com', 'oauth@example.com']) {
    const response = await forgot.POST(json({ email }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  }
  assert.equal(emails.length, 0);
  assert.equal(tokens.length, 0);
});

test('reset links replace older links, expire, and are single-use', async () => {
  users.push({ email: 'user@example.com', passwordHash: 'old-hash', emailVerified: new Date() });
  tokens.push({ identifier: 'reset:user@example.com', token: digest('old-token'), expires: new Date(Date.now() + 60_000) });
  const response = await forgot.POST(json({ email: ' USER@EXAMPLE.COM ' }));
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(tokens.length, 1);
  const url = link(emails[0]);
  const raw = url.searchParams.get('token')!;
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('mode'), 'updatePassword');
  assert.equal(tokens[0].token, digest(raw));
  assert.ok(tokens[0].expires.getTime() - Date.now() <= 30 * 60_000);
  assert.equal((await reset.POST(json({ token: 'old-token', password: 'new-password' }))).status, 400);
  tokens.push({ identifier: 'reset:user@example.com', token: digest('another'), expires: new Date(Date.now() + 60_000) });
  assert.equal((await reset.POST(json({ token: raw, password: 'new-password' }))).status, 200);
  assert.equal(await bcrypt.compare('new-password', users[0].passwordHash!), true);
  assert.equal(tokens.length, 0);
  assert.equal((await reset.POST(json({ token: raw, password: 'new-password' }))).status, 400);
  assert.equal(updates, 1);
});

test('reset rejects invalid, expired and malformed requests without updating the account', async () => {
  users.push({ email: 'user@example.com', passwordHash: 'old-hash', emailVerified: new Date() });
  tokens.push({ identifier: 'reset:user@example.com', token: digest('expired'), expires: new Date(Date.now() - 1) });
  for (const body of [
    { token: 'expired', password: 'valid-password' },
    { token: '', password: 'valid-password' },
    { token: 'expired', password: 'short' },
    { token: 'expired', password: 'x'.repeat(129) },
  ]) assert.equal((await reset.POST(json(body))).status, 400);
  assert.equal(users[0].passwordHash, 'old-hash');
  assert.equal(updates, 0);
});

test('verification GET displays an escaped confirmation without consuming the token; POST consumes it once', async () => {
  const raw = `token"<&'`;
  users.push({ email: 'user@example.com', passwordHash: 'hash', emailVerified: null });
  tokens.push({ identifier: 'user@example.com', token: digest(raw), expires: new Date(Date.now() + 60_000) });
  const url = new URL('https://cloudxx.example/api/auth/verify-email');
  url.searchParams.set('token', raw);
  url.searchParams.set('email', ' USER@EXAMPLE.COM ');
  const page = await verify.GET(new Request(url));
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.match(await page.text(), /value="token&quot;&lt;&amp;&#39;"/);
  assert.equal(tokens.length, 1);
  assert.equal(users[0].emailVerified, null);
  redirect(await verify.POST(form(' USER@EXAMPLE.COM ', raw)), 'success');
  assert.equal(Object.prototype.toString.call(users[0].emailVerified), '[object Date]');
  redirect(await verify.POST(form('user@example.com', raw)), 'invalid');
  assert.equal(updates, 1);
});

test('verification rejects expired, missing and mismatched tokens', async () => {
  users.push({ email: 'user@example.com', passwordHash: 'hash', emailVerified: null });
  tokens.push({ identifier: 'user@example.com', token: digest('expired'), expires: new Date(Date.now() - 1) });
  for (const [email, token] of [['user@example.com', 'expired'], ['other@example.com', 'expired'], ['', 'expired'], ['user@example.com', '']]) {
    const url = new URL('https://cloudxx.example/api/auth/verify-email');
    url.searchParams.set('email', email);
    url.searchParams.set('token', token);
    redirect(await verify.GET(new Request(url)), 'invalid');
    redirect(await verify.POST(form(email, token)), 'invalid');
  }
  assert.equal(updates, 0);
});

test('rate limits every auth mutation before parsing or writing', async () => {
  attempts = 11;
  for (const handler of [register.POST, forgot.POST, reset.POST]) {
    const response = await handler(json({}));
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '900');
  }
  redirect(await verify.POST(form('', '')), 'rate-limited');
  assert.equal(users.length, 0);
  assert.equal(emails.length, 0);
});


test('a token already consumed by another request cannot update a password or verify an account', async () => {
  users.push({ email: 'user@example.com', passwordHash: 'old-hash', emailVerified: null });
  tokens.push({ identifier: 'reset:user@example.com', token: digest('reset-token'), expires: new Date(Date.now() + 60_000) });
  tokens.push({ identifier: 'user@example.com', token: digest('verify-token'), expires: new Date(Date.now() + 60_000) });
  loseTokenRace = true;
  assert.equal((await reset.POST(json({ token: 'reset-token', password: 'new-password' }))).status, 400);
  redirect(await verify.POST(form('user@example.com', 'verify-token')), 'invalid');
  assert.equal(updates, 0);
  assert.equal(users[0].passwordHash, 'old-hash');
  assert.equal(users[0].emailVerified, null);
});

test('registration and password recovery report email provider failures', async () => {
  globalThis.fetch = async () => new Response(null, { status: 503 });
  assert.equal((await register.POST(json({ email: 'new@example.com', password: 'long-password' }))).status, 500);
  users.push({ email: 'verified@example.com', passwordHash: 'hash', emailVerified: new Date() });
  assert.equal((await forgot.POST(json({ email: 'verified@example.com' }))).status, 500);
});
