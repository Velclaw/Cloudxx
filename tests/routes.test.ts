import test, { beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// CI runs tests before Prisma client generation. Node's built-in module mocks let
// these route tests replace the database import without generating a client or
// opening a database connection. The flag must be enabled before Node starts.
if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('database-dependent route and rate-limit unit tests', () => {
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--import', 'tsx', fileURLToPath(import.meta.url),
    ], { encoding: 'utf8', timeout: 45_000, env: { ...process.env, NODE_NO_WARNINGS: '1' } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
  });
} else {
  const originalAuthUrl = process.env.AUTH_URL;
  const originalResendKey = process.env.RESEND_API_KEY;
  const originalEmailFrom = process.env.EMAIL_FROM;
  process.env.AUTH_URL = 'https://auth.example.test';
  process.env.RESEND_API_KEY = 'local-test-key';
  process.env.EMAIL_FROM = 'sender@example.test';

  // Each test starts with a fresh set of database stubs; transactions receive
  // the same stubs so assertions can inspect their externally visible effects.
  const db: any = {};
  let session: { user: { id: string } } | null = null;
  mock.module(new URL('../src/lib/prisma.ts', import.meta.url), { namedExports: { prisma: db } });
  mock.module(new URL('../src/auth.ts', import.meta.url), { namedExports: { auth: async () => session } });

  const register = await import('../src/app/api/auth/register/route');
  const forgot = await import('../src/app/api/auth/forgot-password/route');
  const reset = await import('../src/app/api/auth/reset-password/route');
  const verify = await import('../src/app/api/auth/verify-email/route');
  const rateLimit = await import('../src/lib/rate-limit');
  const domains = await import('../src/app/api/domains/route');
  const domain = await import('../src/app/api/domains/[domainId]/route');
  const records = await import('../src/app/api/domains/[domainId]/records/route');
  const record = await import('../src/app/api/domains/[domainId]/records/[recordId]/route');
  const registrars = await import('../src/app/api/registrars/route');
  const registrar = await import('../src/app/api/registrars/[registrarId]/route');
  const audit = await import('../src/app/api/audit-logs/route');
  const dnsApi = await import('../src/lib/dns-api');

  const fetchMock = mock.method(globalThis, 'fetch', async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 200 }));
  const randomMock = mock.method(Math, 'random', () => 0.5);
  beforeEach(() => {
    session = null;
    fetchMock.mock.resetCalls();
    randomMock.mock.mockImplementation(() => 0.5);
    Object.assign(db, {
      $queryRaw: mock.fn(async (..._args: any[]) => [{ attempts: 1 }]),
      $executeRaw: mock.fn(async (..._args: any[]) => 1),
      user: {
        findUnique: mock.fn(async (_args: any) => null as any),
        create: mock.fn(async (args: any) => args.data),
        update: mock.fn(async (args: any) => args.data),
      },
      verificationToken: {
        findFirst: mock.fn(async (_args: any) => null as any),
        create: mock.fn(async (args: any) => args.data),
        deleteMany: mock.fn(async (_args: any) => ({ count: 1 })),
      },
      domain: {
        findMany: mock.fn(async (_args: any) => []),
        findFirst: mock.fn(async (_args: any) => null as any),
        create: mock.fn(async (args: any) => ({ id: 'domain-1', ...args.data })),
        update: mock.fn(async (args: any) => ({ id: 'domain-1', ...args.data })),
        delete: mock.fn(async (_args: any) => ({})),
      },
      dNSRecord: {
        findMany: mock.fn(async (_args: any) => []),
        findFirst: mock.fn(async (_args: any) => null as any),
        create: mock.fn(async (args: any) => ({ id: 'record-1', ...args.data })),
        update: mock.fn(async (args: any) => ({ id: 'record-1', name: '@', type: 'A', ...args.data })),
        delete: mock.fn(async (_args: any) => ({})),
      },
      registrar: {
        findMany: mock.fn(async (_args: any) => []),
        findFirst: mock.fn(async (_args: any) => null as any),
        create: mock.fn(async (args: any) => ({ id: 'registrar-1', ...args.data })),
        update: mock.fn(async (args: any) => ({ id: 'registrar-1', provider: 'Cloudflare', ...args.data })),
        delete: mock.fn(async (_args: any) => ({})),
      },
      auditLog: {
        findMany: mock.fn(async (_args: any) => []),
        create: mock.fn(async (args: any) => args.data),
      },
      $transaction: mock.fn(async (operation: any) => typeof operation === 'function' ? operation(db) : Promise.all(operation)),
    });
  });
  after(() => {
    for (const [key, value] of Object.entries({ AUTH_URL: originalAuthUrl, RESEND_API_KEY: originalResendKey, EMAIL_FROM: originalEmailFrom })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    mock.restoreAll();
  });

  const jsonRequest = (body: unknown, method = 'POST') => new Request('https://app.example.test/api', {
    method, headers: { 'content-type': 'application/json', 'x-real-ip': '192.0.2.1' }, body: JSON.stringify(body),
  });
  const formRequest = (token: string, email: string) => new Request('https://app.example.test/api', {
    method: 'POST', body: new URLSearchParams({ token, email }),
  });
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  const domainContext = { params: Promise.resolve({ domainId: 'domain-1' }) };
  const recordContext = { params: Promise.resolve({ domainId: 'domain-1', recordId: 'record-1' }) };
  const registrarContext = { params: Promise.resolve({ registrarId: 'registrar-1' }) };
  const signIn = () => { session = { user: { id: 'user-1' } }; };

  test('rate limiting uses trusted IP, scoped hash, attempt boundary and fails closed on missing rows', async () => {
    const headers = new Headers({ 'x-real-ip': '192.0.2.5', 'x-forwarded-for': '203.0.113.7' });
    db.$queryRaw.mock.mockImplementation(async () => [{ attempts: 5 }]);
    assert.equal(await rateLimit.consumeAuthRateLimit({ headers }, 'login', 5, 1000), true);
    assert.equal(db.$queryRaw.mock.calls[0].arguments[1], digest('login:192.0.2.5'));
    db.$queryRaw.mock.mockImplementation(async () => [{ attempts: 6 }]);
    assert.equal(await rateLimit.consumeAuthRateLimit({ headers }, 'login', 5, 1000), false);
    db.$queryRaw.mock.mockImplementation(async () => []);
    assert.equal(await rateLimit.consumeAuthRateLimit({ headers: new Headers({ 'x-forwarded-for': '203.0.113.7' }) }, 'register', 5, 1000), false);
    assert.equal(db.$queryRaw.mock.calls[2].arguments[1], digest('register:unknown'));
  });

  test('rate-limit cleanup failures do not reject a permitted request', async () => {
    randomMock.mock.mockImplementation(() => 0);
    db.$executeRaw.mock.mockImplementation(async () => { throw new Error('cleanup failed'); });
    assert.equal(await rateLimit.consumeAuthRateLimit({ headers: new Headers() }, 'login', 5, 1000), true);
    assert.equal(db.$executeRaw.mock.callCount(), 1);
  });

  test('registration normalizes input, hashes the password and sends a link whose token is stored as a digest', async () => {
    const response = await register.POST(jsonRequest({ email: ' User@Example.test ', password: 'password123', fullName: ` ${'N'.repeat(105)} ` }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    const user = db.user.create.mock.calls[0].arguments[0].data;
    assert.equal(user.email, 'user@example.test');
    assert.equal(user.name.length, 100);
    assert.notEqual(user.passwordHash, 'password123');
    const payload = JSON.parse(String(fetchMock.mock.calls[0].arguments[1]?.body));
    const link = new URL(payload.text.split('\n\n')[1]);
    assert.equal(link.pathname, '/api/auth/verify-email');
    assert.equal(link.searchParams.get('email'), 'user@example.test');
    const raw = link.searchParams.get('token')!;
    assert.match(raw, /^[a-f0-9]{64}$/);
    const saved = db.verificationToken.create.mock.calls[0].arguments[0].data;
    assert.equal(saved.identifier, user.email);
    assert.equal(saved.token, digest(raw));
    assert.notEqual(saved.token, raw);
    assert.ok(saved.expires.getTime() - Date.now() > 23 * 60 * 60 * 1000);
  });

  test('registration rejects invalid inputs and avoids disclosing existing verified or OAuth accounts', async () => {
    for (const body of [{ email: 'bad', password: 'password' }, { email: 'a@b.test', password: 'short' }, { email: 'a@b.test', password: 'x'.repeat(129) }]) {
      assert.equal((await register.POST(jsonRequest(body))).status, 400);
    }
    assert.equal(db.user.findUnique.mock.callCount(), 0);
    for (const existing of [{ emailVerified: new Date(), passwordHash: 'hash' }, { emailVerified: null, passwordHash: null }]) {
      db.user.findUnique.mock.mockImplementation(async () => existing);
      const response = await register.POST(jsonRequest({ email: 'a@b.test', password: 'password' }));
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
    assert.equal(db.user.create.mock.callCount(), 0);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test('unverified registration resends verification without replacing the existing password', async () => {
    db.user.findUnique.mock.mockImplementation(async () => ({ emailVerified: null, passwordHash: 'existing' }));
    assert.equal((await register.POST(jsonRequest({ email: 'a@b.test', password: 'newpassword' }))).status, 200);
    assert.equal(db.user.create.mock.callCount(), 0);
    assert.equal(db.user.update.mock.callCount(), 0);
    assert.equal(db.verificationToken.deleteMany.mock.callCount(), 1);
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  test('forgot password hides missing, invalid and ineligible accounts', async () => {
    for (const input of ['invalid', 'none@example.test']) {
      const response = await forgot.POST(jsonRequest({ email: input }));
      assert.deepEqual(await response.json(), { ok: true });
    }
    for (const user of [{ passwordHash: null, emailVerified: new Date() }, { passwordHash: 'hash', emailVerified: null }]) {
      db.user.findUnique.mock.mockImplementation(async () => user);
      assert.deepEqual(await (await forgot.POST(jsonRequest({ email: 'a@b.test' }))).json(), { ok: true });
    }
    assert.equal(db.verificationToken.create.mock.callCount(), 0);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test('forgot password replaces old reset tokens and emails a raw token while storing its digest', async () => {
    db.user.findUnique.mock.mockImplementation(async () => ({ passwordHash: 'hash', emailVerified: new Date() }));
    const response = await forgot.POST(jsonRequest({ email: ' User@Example.test ' }));
    assert.equal(response.status, 200);
    assert.deepEqual(db.verificationToken.deleteMany.mock.calls[0].arguments[0], { where: { identifier: 'reset:user@example.test' } });
    const sent = JSON.parse(String(fetchMock.mock.calls[0].arguments[1]?.body));
    const link = new URL(sent.text.split('\n\n')[1]);
    const saved = db.verificationToken.create.mock.calls[0].arguments[0].data;
    assert.equal(link.searchParams.get('mode'), 'updatePassword');
    assert.equal(saved.token, digest(link.searchParams.get('token')!));
    assert.ok(saved.expires.getTime() - Date.now() > 29 * 60 * 1000);
  });

  test('auth endpoints stop before processing a rate-limited request', async () => {
    db.$queryRaw.mock.mockImplementation(async () => [{ attempts: 11 }]);
    for (const handler of [register.POST, forgot.POST, reset.POST]) {
      const response = await handler(jsonRequest({}));
      assert.equal(response.status, 429);
      assert.equal(response.headers.get('retry-after'), '900');
    }
    const response = await verify.POST(formRequest('token', 'a@b.test'));
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get('location')!).searchParams.get('verified'), 'rate-limited');
    assert.equal(db.user.findUnique.mock.callCount(), 0);
    assert.equal(db.$transaction.mock.callCount(), 0);
  });

  test('reset consumes a valid token once, revokes other links and updates the correct account', async () => {
    db.verificationToken.findFirst.mock.mockImplementation(async () => ({ identifier: 'reset:user@example.test' }));
    const response = await reset.POST(jsonRequest({ token: 'raw-token', password: 'newpassword' }));
    assert.equal(response.status, 200);
    const query = db.verificationToken.findFirst.mock.calls[0].arguments[0].where;
    assert.equal(query.token, digest('raw-token'));
    assert.deepEqual(query.identifier, { startsWith: 'reset:' });
    assert.ok(query.expires.gt instanceof Date);
    const deletion = db.verificationToken.deleteMany.mock.calls;
    assert.equal(deletion.length, 2);
    assert.equal(deletion[0].arguments[0].where.token, digest('raw-token'));
    assert.deepEqual(deletion[1].arguments[0], { where: { identifier: 'reset:user@example.test' } });
    const update = db.user.update.mock.calls[0].arguments[0];
    assert.equal(update.where.email, 'user@example.test');
    assert.notEqual(update.data.passwordHash, 'newpassword');
  });

  test('reset rejects invalid input, expired tokens and a token already consumed by a concurrent request', async () => {
    assert.equal((await reset.POST(jsonRequest({ token: '', password: 'password' }))).status, 400);
    assert.equal((await reset.POST(jsonRequest({ token: 'raw', password: 'short' }))).status, 400);
    assert.equal(db.$transaction.mock.callCount(), 0);
    assert.equal((await reset.POST(jsonRequest({ token: 'raw', password: 'password' }))).status, 400);
    db.verificationToken.findFirst.mock.mockImplementation(async () => ({ identifier: 'reset:user@example.test' }));
    db.verificationToken.deleteMany.mock.mockImplementation(async () => ({ count: 0 }));
    assert.equal((await reset.POST(jsonRequest({ token: 'raw', password: 'password' }))).status, 400);
    assert.equal(db.user.update.mock.callCount(), 0);
  });

  test('verification GET displays a safely escaped confirmation without consuming the token', async () => {
    db.verificationToken.findFirst.mock.mockImplementation(async () => ({ identifier: 'user@example.test' }));
    const url = new URL('https://app.example.test/api/auth/verify-email');
    url.searchParams.set('token', 'raw"<token>');
    url.searchParams.set('email', ' User@Example.test ');
    const response = await verify.GET(new Request(url));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control')!, /no-store/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(await response.text(), /value="raw&quot;&lt;token&gt;"/);
    const where = db.verificationToken.findFirst.mock.calls[0].arguments[0].where;
    assert.equal(where.identifier, 'user@example.test');
    assert.equal(where.token, digest('raw"<token>'));
    assert.equal(db.verificationToken.deleteMany.mock.callCount(), 0);
    assert.equal(db.user.update.mock.callCount(), 0);
  });

  test('verification rejects missing, expired and already consumed tokens', async () => {
    const missing = await verify.GET(new Request('https://app.example.test/api/auth/verify-email'));
    assert.equal(new URL(missing.headers.get('location')!).searchParams.get('verified'), 'invalid');
    const expired = await verify.GET(new Request('https://app.example.test/api/auth/verify-email?token=raw&email=a%40b.test'));
    assert.equal(new URL(expired.headers.get('location')!).searchParams.get('verified'), 'invalid');
    db.verificationToken.deleteMany.mock.mockImplementation(async () => ({ count: 0 }));
    const replay = await verify.POST(formRequest('raw', 'a@b.test'));
    assert.equal(new URL(replay.headers.get('location')!).searchParams.get('verified'), 'invalid');
    assert.equal(db.user.update.mock.callCount(), 0);
  });

  test('verification POST consumes the digest and marks the normalized user verified in one transaction', async () => {
    const response = await verify.POST(formRequest('raw-token', ' User@Example.test '));
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get('location')!).searchParams.get('verified'), 'success');
    const where = db.verificationToken.deleteMany.mock.calls[0].arguments[0].where;
    assert.equal(where.identifier, 'user@example.test');
    assert.equal(where.token, digest('raw-token'));
    assert.ok(where.expires.gt instanceof Date);
    const update = db.user.update.mock.calls[0].arguments[0];
    assert.equal(update.where.email, 'user@example.test');
    assert.ok(update.data.emailVerified instanceof Date);
    assert.equal(db.$transaction.mock.callCount(), 1);
  });

  test('DNS endpoints reject anonymous requests before database access', async () => {
    const request = jsonRequest({});
    const checks = [
      () => domains.GET(), () => domains.POST(request),
      () => domain.GET(request, domainContext), () => domain.PATCH(request, domainContext), () => domain.DELETE(request, domainContext),
      () => records.GET(request, domainContext), () => records.POST(request, domainContext),
      () => record.PATCH(request, recordContext), () => record.DELETE(request, recordContext),
      () => registrars.GET(), () => registrars.POST(request),
      () => registrar.PATCH(request, registrarContext), () => registrar.DELETE(request, registrarContext),
      () => audit.GET(request),
    ];
    for (const check of checks) assert.equal((await check()).status, 401);
    assert.equal(db.$transaction.mock.callCount(), 0);
    assert.equal(db.domain.findFirst.mock.callCount(), 0);
    assert.equal(db.registrar.findFirst.mock.callCount(), 0);
    assert.equal(db.auditLog.findMany.mock.callCount(), 0);
  });

  test('DNS helpers extract the first forwarded IP and serialize audit snapshots', async () => {
    signIn();
    assert.equal(await dnsApi.requireDnsUser(), 'user-1');
    assert.equal(dnsApi.getRequestIp(new Request('https://app.example.test', { headers: { 'x-forwarded-for': ' 192.0.2.1, 192.0.2.2', 'x-real-ip': '192.0.2.3' } })), '192.0.2.1');
    assert.equal(dnsApi.getRequestIp(new Request('https://app.example.test', { headers: { 'x-real-ip': '192.0.2.3' } })), '192.0.2.3');
    assert.equal(dnsApi.getRequestIp(new Request('https://app.example.test')), null);
    assert.deepEqual(dnsApi.auditPayload({ createdAt: new Date('2026-01-01T00:00:00Z'), extra: undefined }), { createdAt: '2026-01-01T00:00:00.000Z' });
  });

  test('domain creation normalizes and limits input, then records an audit entry', async () => {
    signIn();
    const response = await domains.POST(jsonRequest({ name: ' Example.COM. ', nameservers: ['ns.example.test', 10, ...Array(25).fill('ns2.example.test')], registrar: 'r'.repeat(90), autoRenew: true, dnssec: true, environment: 'unrecognized' }));
    assert.equal(response.status, 201);
    const data = db.domain.create.mock.calls[0].arguments[0].data;
    assert.equal(data.name, 'example.com');
    assert.equal(data.userId, 'user-1');
    assert.equal(data.nameservers.length, 20);
    assert.equal(data.registrar.length, 80);
    assert.equal(data.environment, 'production');
    assert.equal(data.autoRenew, true);
    assert.equal(data.dnssec, true);
    const entry = db.auditLog.create.mock.calls[0].arguments[0].data;
    assert.equal(entry.action, 'DOMAIN_CREATED');
    assert.equal(entry.domainId, 'domain-1');
    assert.equal(entry.ipAddress, '192.0.2.1');
    assert.deepEqual(entry.after, { name: 'example.com', nameservers: data.nameservers });
  });

  test('domain creation rejects invalid names and translates uniqueness failures', async () => {
    signIn();
    assert.equal((await domains.POST(jsonRequest({ name: 'invalid' }))).status, 400);
    assert.equal(db.$transaction.mock.callCount(), 0);
    db.domain.create.mock.mockImplementation(async () => { throw { code: 'P2002' }; });
    assert.equal((await domains.POST(jsonRequest({ name: 'example.test' }))).status, 409);
  });

  test('domain and record lookups are scoped to the signed-in owner', async () => {
    signIn();
    assert.equal((await domain.GET(jsonRequest({}), domainContext)).status, 404);
    assert.deepEqual(db.domain.findFirst.mock.calls[0].arguments[0].where, { id: 'domain-1', userId: 'user-1' });
    assert.equal((await records.GET(jsonRequest({}), domainContext)).status, 404);
    assert.equal(db.dNSRecord.findMany.mock.callCount(), 0);
    assert.equal((await record.DELETE(jsonRequest({}), recordContext)).status, 404);
    assert.deepEqual(db.dNSRecord.findFirst.mock.calls[0].arguments[0].where, { id: 'record-1', domainId: 'domain-1', domain: { userId: 'user-1' } });
    assert.equal(db.dNSRecord.delete.mock.callCount(), 0);
  });

  test('domain update validates fields and audits the before and after snapshots', async () => {
    signIn();
    db.domain.findFirst.mock.mockImplementation(async () => ({ id: 'domain-1', name: 'old.example' }));
    assert.equal((await domain.PATCH(jsonRequest({ nameservers: [12] }, 'PATCH'), domainContext)).status, 400);
    const response = await domain.PATCH(jsonRequest({ name: ' NEW.Example. ', nameservers: ['ns.example'], dnssec: true }, 'PATCH'), domainContext);
    assert.equal(response.status, 200);
    assert.deepEqual(db.domain.update.mock.calls[0].arguments[0].data, { name: 'new.example', nameservers: ['ns.example'], dnssec: true });
    const entry = db.auditLog.create.mock.calls[0].arguments[0].data;
    assert.equal(entry.action, 'DOMAIN_UPDATED');
    assert.equal(entry.before.name, 'old.example');
    assert.equal(entry.after.name, 'new.example');
  });

  test('DNS record creation validates TTL bounds and normalizes auto TTL and fields', async () => {
    signIn();
    db.domain.findFirst.mock.mockImplementation(async () => ({ id: 'domain-1' }));
    for (const ttl of [59, 86401, 60.5]) {
      assert.equal((await records.POST(jsonRequest({ type: 'A', name: '@', content: '192.0.2.1', ttl }), domainContext)).status, 400);
    }
    assert.equal((await records.POST(jsonRequest({ type: 'HTTPS', name: '@', content: 'value' }), domainContext)).status, 400);
    const response = await records.POST(jsonRequest({ type: 'mx', name: ' @ ', content: ' mail.example ', ttl: 'Auto', priority: 10 }), domainContext);
    assert.equal(response.status, 201);
    const data = db.dNSRecord.create.mock.calls[0].arguments[0].data;
    assert.equal(data.type, 'MX');
    assert.equal(data.name, '@');
    assert.equal(data.content, 'mail.example');
    assert.equal(data.ttl, 300);
    assert.equal(data.ttlAuto, true);
    assert.equal(data.priority, 10);
    assert.equal(db.auditLog.create.mock.calls[0].arguments[0].data.action, 'DNS_RECORD_CREATED');
  });

  test('DNS record updates reject invalid TTL and audit successful edits', async () => {
    signIn();
    db.dNSRecord.findFirst.mock.mockImplementation(async () => ({ id: 'record-1', type: 'A', name: '@', ttl: 300 }));
    assert.equal((await record.PATCH(jsonRequest({ ttl: 59 }, 'PATCH'), recordContext)).status, 400);
    assert.equal(db.dNSRecord.update.mock.callCount(), 0);
    assert.equal((await record.PATCH(jsonRequest({ type: 'aaaa', ttl: 86400, name: ' www ' }, 'PATCH'), recordContext)).status, 200);
    assert.deepEqual(db.dNSRecord.update.mock.calls[0].arguments[0].data, { type: 'AAAA', name: 'www', ttl: 86400, ttlAuto: false });
    const entry = db.auditLog.create.mock.calls[0].arguments[0].data;
    assert.equal(entry.action, 'DNS_RECORD_UPDATED');
    assert.equal(entry.before.type, 'A');
    assert.equal(entry.after.type, 'AAAA');
  });

  test('registrar creation validates provider and stores disconnected metadata only', async () => {
    signIn();
    assert.equal((await registrars.POST(jsonRequest({ provider: 'unknown', displayName: 'test' }))).status, 400);
    const response = await registrars.POST(jsonRequest({ provider: 'Cloudflare', displayName: ' My account ', accountEmail: 'a'.repeat(260) }));
    assert.equal(response.status, 201);
    const data = db.registrar.create.mock.calls[0].arguments[0].data;
    assert.equal(data.userId, 'user-1');
    assert.equal(data.displayName, 'My account');
    assert.equal(data.accountEmail.length, 254);
    assert.equal(data.status, 'disconnected');
    assert.equal(db.auditLog.create.mock.calls[0].arguments[0].data.action, 'REGISTRAR_CREATED');
  });

  test('registrar updates and deletes require ownership', async () => {
    signIn();
    assert.equal((await registrar.PATCH(jsonRequest({ displayName: 'new' }, 'PATCH'), registrarContext)).status, 404);
    assert.deepEqual(db.registrar.findFirst.mock.calls[0].arguments[0].where, { id: 'registrar-1', userId: 'user-1' });
    assert.equal((await registrar.DELETE(jsonRequest({}), registrarContext)).status, 404);
    assert.equal(db.registrar.update.mock.callCount(), 0);
    assert.equal(db.registrar.delete.mock.callCount(), 0);
    db.registrar.findFirst.mock.mockImplementation(async () => ({ id: 'registrar-1', provider: 'Cloudflare' }));
    assert.equal((await registrar.PATCH(jsonRequest({ displayName: '  updated  ', accountEmail: null }, 'PATCH'), registrarContext)).status, 200);
    assert.deepEqual(db.registrar.update.mock.calls[0].arguments[0].data, { displayName: 'updated', accountEmail: null });
    assert.equal((await registrar.DELETE(jsonRequest({}), registrarContext)).status, 200);
    assert.equal(db.registrar.delete.mock.callCount(), 1);
  });

  test('audit logs use the owner and clamp or default the requested limit', async () => {
    signIn();
    for (const [query, expected] of [['', 50], ['?limit=0', 1], ['?limit=101', 100], ['?limit=1.5', 50], ['?limit=wrong', 50]] as const) {
      assert.equal((await audit.GET(new Request(`https://app.example.test/api/audit-logs${query}`))).status, 200);
      const args = db.auditLog.findMany.mock.calls.at(-1).arguments[0];
      assert.deepEqual(args.where, { userId: 'user-1' });
      assert.equal(args.take, expected);
      assert.deepEqual(args.orderBy, { createdAt: 'desc' });
    }
  });
}
