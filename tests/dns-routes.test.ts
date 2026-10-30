import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { encode } from '@auth/core/jwt';
import { AsyncLocalStorage } from 'node:async_hooks';

// Auth.js reads the session from Next's request storage. Supply a synthetic
// session there so route authorization runs as it does for a real request.
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
const { workUnitAsyncStorage } = await import('next/dist/server/app-render/work-unit-async-storage.external');
const { workAsyncStorage } = await import('next/dist/server/app-render/work-async-storage.external');
process.env.AUTH_SECRET = 'synthetic-test-secret-for-authjs';
process.env.AUTH_URL = 'http://localhost:3000';

type Call = { method: string; args: any };
let calls: Call[] = [];
let existingDomain: any = null;
let existingRecord: any = null;
let existingRegistrar: any = null;
let failure: unknown = null;
const recordCall = (method: string, args: any) => { calls.push({ method, args }); };
const prisma = {
  domain: {
    async findMany(args: any) { recordCall('domain.findMany', args); return []; },
    async findFirst(args: any) { recordCall('domain.findFirst', args); return existingDomain; },
    async create(args: any) { recordCall('domain.create', args); if (failure) throw failure; return { id: 'domain-1', ...args.data }; },
    async update(args: any) { recordCall('domain.update', args); if (failure) throw failure; return { ...existingDomain, ...args.data }; },
    async delete(args: any) { recordCall('domain.delete', args); },
  },
  dNSRecord: {
    async findMany(args: any) { recordCall('record.findMany', args); return []; },
    async findFirst(args: any) { recordCall('record.findFirst', args); return existingRecord; },
    async create(args: any) { recordCall('record.create', args); return { id: 'record-1', ...args.data }; },
    async update(args: any) { recordCall('record.update', args); return { ...existingRecord, ...args.data }; },
    async delete(args: any) { recordCall('record.delete', args); },
  },
  registrar: {
    async findMany(args: any) { recordCall('registrar.findMany', args); return []; },
    async findFirst(args: any) { recordCall('registrar.findFirst', args); return existingRegistrar; },
    async create(args: any) { recordCall('registrar.create', args); if (failure) throw failure; return { id: 'registrar-1', ...args.data }; },
    async update(args: any) { recordCall('registrar.update', args); return { ...existingRegistrar, ...args.data }; },
    async delete(args: any) { recordCall('registrar.delete', args); },
  },
  auditLog: {
    async findMany(args: any) { recordCall('audit.findMany', args); return []; },
    async create(args: any) { recordCall('audit.create', args); },
  },
  async $transaction(operation: any) {
    if (typeof operation === 'function') return operation(prisma);
    return Promise.all(operation);
  },
};
const fixtures = { userId: 'user-1' as string | null };
(globalThis as any).prisma = prisma;

function withSession<T extends Record<string, any>>(routes: T): T {
  return Object.fromEntries(Object.entries(routes).map(([name, handler]) => [name, async (...args: any[]) => {
    const cookieName = 'authjs.session-token';
    const token = fixtures.userId ? await encode({ token: { sub: fixtures.userId }, secret: process.env.AUTH_SECRET!, salt: cookieName }) : '';
    const headers = new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' });
    if (token) headers.set('cookie', `${cookieName}=${token}`);
    return workAsyncStorage.run({ route: '/api/test' } as any, () =>
      workUnitAsyncStorage.run({ type: 'request', phase: 'action', headers } as any, () => handler(...args)));
  }])) as T;
}
const domains = withSession(await import('../src/app/api/domains/route'));
const domain = withSession(await import('../src/app/api/domains/[domainId]/route'));
const records = withSession(await import('../src/app/api/domains/[domainId]/records/route'));
const record = withSession(await import('../src/app/api/domains/[domainId]/records/[recordId]/route'));
const registrars = withSession(await import('../src/app/api/registrars/route'));
const registrar = withSession(await import('../src/app/api/registrars/[registrarId]/route'));
const audit = withSession(await import('../src/app/api/audit-logs/route'));

const context = { params: Promise.resolve({ domainId: 'domain-1', recordId: 'record-1', registrarId: 'registrar-1' }) };
function request(body?: unknown) {
  return new Request('https://example.test/api', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1, 192.0.2.2' }, body: body === undefined ? '{' : JSON.stringify(body) });
}
function call(method: string) { return calls.find(entry => entry.method === method)?.args; }
beforeEach(() => {
  fixtures.userId = 'user-1';
  calls = [];
  existingDomain = null;
  existingRecord = null;
  existingRegistrar = null;
  failure = null;
});

test('all DNS routes reject unauthenticated requests before accessing storage', async () => {
  fixtures.userId = null;
  const responses = await Promise.all([
    domains.GET(), domains.POST(request({})), domain.GET(request(), context), domain.PATCH(request({}), context), domain.DELETE(request(), context),
    records.GET(request(), context), records.POST(request({}), context), record.PATCH(request({}), context), record.DELETE(request(), context),
    registrars.GET(), registrars.POST(request({})), registrar.PATCH(request({}), context), registrar.DELETE(request(), context), audit.GET(request()),
  ]);
  for (const response of responses) {
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
  }
  assert.deepEqual(calls, []);
});

test('domain and record lookups are scoped to the authenticated owner', async () => {
  assert.equal((await domain.GET(request(), context)).status, 404);
  assert.deepEqual(call('domain.findFirst').where, { id: 'domain-1', userId: 'user-1' });
  calls = [];
  assert.equal((await records.GET(request(), context)).status, 404);
  assert.deepEqual(call('domain.findFirst').where, { id: 'domain-1', userId: 'user-1' });
  assert.equal(call('record.findMany'), undefined);
  calls = [];
  assert.equal((await record.DELETE(request(), context)).status, 404);
  assert.deepEqual(call('record.findFirst').where, { id: 'record-1', domainId: 'domain-1', domain: { userId: 'user-1' } });
  assert.equal(call('record.delete'), undefined);
  calls = [];
  assert.equal((await registrar.DELETE(request(), context)).status, 404);
  assert.deepEqual(call('registrar.findFirst').where, { id: 'registrar-1', userId: 'user-1' });
});

test('domain creation normalizes input, limits nameservers and creates an audit record', async () => {
  const nameservers = [...Array.from({ length: 22 }, (_, i) => `ns${i}.example.com`), 42];
  const response = await domains.POST(request({ name: ' Example.COM. ', nameservers, autoRenew: true, environment: 'unknown' }));
  assert.equal(response.status, 201);
  assert.equal(call('domain.create').data.name, 'example.com');
  assert.equal(call('domain.create').data.userId, 'user-1');
  assert.equal(call('domain.create').data.nameservers.length, 20);
  assert.equal(call('domain.create').data.environment, 'production');
  assert.equal(call('audit.create').data.action, 'DOMAIN_CREATED');
  assert.equal(call('audit.create').data.ipAddress, '192.0.2.1');
});

test('domain creation rejects malformed inputs and maps duplicate names to conflict', async () => {
  assert.equal((await domains.POST(request())).status, 400);
  assert.equal((await domains.POST(request({ name: 'bad domain' }))).status, 400);
  assert.equal(call('domain.create'), undefined);
  failure = { code: 'P2002' };
  assert.equal((await domains.POST(request({ name: 'example.com' }))).status, 409);
});

test('domain updates validate nameservers and preserve before/after audit data', async () => {
  existingDomain = { id: 'domain-1', name: 'old.example' };
  assert.equal((await domain.PATCH(request({ nameservers: ['ns.example', 5] }), context)).status, 400);
  assert.equal(call('domain.update'), undefined);
  const response = await domain.PATCH(request({ name: ' NEW.Example. ', dnssec: true }), context);
  assert.equal(response.status, 200);
  assert.deepEqual(call('domain.update').data, { name: 'new.example', dnssec: true });
  assert.equal(call('audit.create').data.before.name, 'old.example');
  assert.equal(call('audit.create').data.after.name, 'new.example');
});

test('record creation validates inputs and TTL and normalizes accepted data', async () => {
  existingDomain = { id: 'domain-1' };
  for (const body of [
    { type: 'HTTPS', name: 'www', content: '1.2.3.4' },
    { type: 'A', name: '', content: '1.2.3.4' },
    { type: 'A', name: 'www', content: '' },
    { type: 'A', name: 'www', content: '1.2.3.4', ttl: 59 },
    { type: 'A', name: 'www', content: '1.2.3.4', ttl: 86401 },
  ]) assert.equal((await records.POST(request(body), context)).status, 400);
  assert.equal(call('record.create'), undefined);
  const response = await records.POST(request({ type: 'a', name: ' www ', content: ' 1.2.3.4 ', ttl: 'Auto' }), context);
  assert.equal(response.status, 201);
  assert.deepEqual({ ...call('record.create').data, comment: undefined }, {
    domainId: 'domain-1', type: 'A', name: 'www', content: '1.2.3.4', ttl: 300, ttlAuto: true,
    priority: null, port: null, weight: null, proxied: false, comment: undefined,
  });
  assert.equal(call('audit.create').data.action, 'DNS_RECORD_CREATED');
});

test('record updates validate TTL and audit changes; delete records the previous value', async () => {
  existingRecord = { id: 'record-1', type: 'A', name: 'www', content: '1.2.3.4' };
  assert.equal((await record.PATCH(request({ ttl: 59 }), context)).status, 400);
  assert.equal(call('record.update'), undefined);
  assert.equal((await record.PATCH(request({ type: 'txt', content: ' value ', ttl: 60 }), context)).status, 200);
  assert.deepEqual(call('record.update').data, { type: 'TXT', content: 'value', ttl: 60, ttlAuto: false });
  assert.equal(call('audit.create').data.before.content, '1.2.3.4');
  calls = [];
  assert.equal((await record.DELETE(request(), context)).status, 200);
  assert.equal(call('audit.create').data.action, 'DNS_RECORD_DELETED');
  assert.equal(call('audit.create').data.before.content, '1.2.3.4');
  assert.deepEqual(call('record.delete').where, { id: 'record-1' });
});

test('registrars validate providers, normalize display names and map duplicates', async () => {
  for (const body of [{ provider: 'unknown', displayName: 'name' }, { provider: 'Cloudflare', displayName: ' ' }, { provider: 'Cloudflare', displayName: 'x'.repeat(101) }]) {
    assert.equal((await registrars.POST(request(body))).status, 400);
  }
  assert.equal((await registrars.POST(request({ provider: 'Cloudflare', displayName: ' My DNS ' }))).status, 201);
  assert.equal(call('registrar.create').data.displayName, 'My DNS');
  assert.equal(call('registrar.create').data.status, 'disconnected');
  assert.equal(call('audit.create').data.action, 'REGISTRAR_CREATED');
  failure = { code: 'P2002' };
  assert.equal((await registrars.POST(request({ provider: 'Cloudflare', displayName: 'My DNS' }))).status, 409);
});

test('audit log limits are clamped and queries remain owner-scoped', async () => {
  for (const [query, expected] of [['', 50], ['?limit=0', 1], ['?limit=200', 100], ['?limit=3.5', 50]]) {
    const response = await audit.GET(new Request(`https://example.test/api/audit-logs${query}`));
    assert.equal(response.status, 200);
    const args = calls.at(-1)!.args;
    assert.deepEqual(args.where, { userId: 'user-1' });
    assert.equal(args.take, expected);
  }
});


test('listing resources uses the authenticated owner', async () => {
  assert.equal((await domains.GET()).status, 200);
  assert.deepEqual(call('domain.findMany').where, { userId: 'user-1' });
  assert.equal((await registrars.GET()).status, 200);
  assert.deepEqual(call('registrar.findMany').where, { userId: 'user-1' });
  existingDomain = { id: 'domain-1' };
  assert.equal((await records.GET(request(), context)).status, 200);
  assert.deepEqual(call('record.findMany').where, { domainId: 'domain-1' });
});

test('domain deletion and registrar edits audit the owner-scoped resource', async () => {
  existingDomain = { id: 'domain-1', name: 'example.com' };
  assert.equal((await domain.DELETE(request(), context)).status, 200);
  assert.equal(call('audit.create').data.action, 'DOMAIN_DELETED');
  assert.equal(call('audit.create').data.before.name, 'example.com');
  assert.deepEqual(call('domain.delete').where, { id: 'domain-1' });
  calls = [];
  existingRegistrar = { id: 'registrar-1', provider: 'Cloudflare' };
  assert.equal((await registrar.PATCH(request({ displayName: '  updated  ' }), context)).status, 200);
  assert.deepEqual(call('registrar.update').data, { displayName: 'updated' });
  assert.equal(call('audit.create').data.action, 'REGISTRAR_UPDATED');
  calls = [];
  assert.equal((await registrar.DELETE(request(), context)).status, 200);
  assert.equal(call('audit.create').data.action, 'REGISTRAR_DELETED');
  assert.deepEqual(call('registrar.delete').where, { id: 'registrar-1' });
});
