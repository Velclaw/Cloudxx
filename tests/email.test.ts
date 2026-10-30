import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, getAuthBaseUrl, sendAuthEmail } from '../src/lib/email';

const environmentKeys = ['AUTH_URL', 'NEXTAUTH_URL', 'VERCEL_URL', 'NODE_ENV', 'RESEND_API_KEY', 'EMAIL_FROM'] as const;

function withCleanEnvironment(t: import('node:test').TestContext) {
  const original = new Map(environmentKeys.map(key => [key, process.env[key]]));
  for (const key of environmentKeys) delete process.env[key];
  t.after(() => {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else Object.assign(process.env, { [key]: value });
    }
  });
}

test('escapes all HTML-sensitive characters without changing ordinary text', () => {
  assert.equal(escapeHtml(`A&B <tag> "quoted" 'single'`), 'A&amp;B &lt;tag&gt; &quot;quoted&quot; &#39;single&#39;');
  assert.equal(escapeHtml('ordinary text'), 'ordinary text');
});

test('selects the configured authentication URL in precedence order', t => {
  withCleanEnvironment(t);
  process.env.VERCEL_URL = 'preview.example.test';
  assert.equal(getAuthBaseUrl().href, 'https://preview.example.test/');
  process.env.NEXTAUTH_URL = 'https://legacy.example.test/path';
  assert.equal(getAuthBaseUrl().href, 'https://legacy.example.test/path');
  process.env.AUTH_URL = 'https://auth.example.test/base';
  assert.equal(getAuthBaseUrl().href, 'https://auth.example.test/base');
});

test('rejects missing, malformed and unsafe authentication URLs', t => {
  withCleanEnvironment(t);
  assert.throws(() => getAuthBaseUrl(), /Configure AUTH_URL/);
  process.env.AUTH_URL = 'not a URL';
  assert.throws(() => getAuthBaseUrl(), /Invalid URL/);
  process.env.AUTH_URL = 'javascript:alert(1)';
  assert.throws(() => getAuthBaseUrl(), /HTTP or HTTPS/);
  process.env.AUTH_URL = 'http://localhost:3000';
  assert.equal(getAuthBaseUrl().protocol, 'http:');
  Object.assign(process.env, { NODE_ENV: 'production' });
  assert.throws(() => getAuthBaseUrl(), /HTTPS in production/);
  process.env.AUTH_URL = 'https://auth.example.test';
  assert.equal(getAuthBaseUrl().protocol, 'https:');
});

test('sends escaped HTML and preserves plain text in the provider request', async t => {
  withCleanEnvironment(t);
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'Cloudxx <sender@example.test>';
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 200 }));
  const subject = 'Verify <account> & "email"';
  const url = 'https://example.test/?token=a&next="quoted"';
  await sendAuthEmail('user@example.test', subject, url);
  assert.equal(fetchMock.mock.callCount(), 1);
  const [endpoint, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(endpoint, 'https://api.resend.com/emails');
  assert.equal(init?.method, 'POST');
  assert.deepEqual(init?.headers, { Authorization: 'Bearer test-key', 'Content-Type': 'application/json' });
  const body = JSON.parse(String(init?.body));
  assert.equal(body.from, 'Cloudxx <sender@example.test>');
  assert.equal(body.to, 'user@example.test');
  assert.equal(body.subject, subject);
  assert.match(body.html, /Verify &lt;account&gt; &amp; &quot;email&quot;/);
  assert.ok(body.html.includes('href="https://example.test/?token=a&amp;next=&quot;quoted&quot;"'));
  assert.ok(body.text.includes(subject));
  assert.ok(body.text.includes(url));
});

test('fails when email configuration is incomplete or the provider rejects the request', async t => {
  withCleanEnvironment(t);
  const fetchMock = t.mock.method(globalThis, 'fetch', async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 403 }));
  await assert.rejects(sendAuthEmail('user@example.test', 'subject', 'https://example.test'), /chưa được cấu hình/);
  process.env.RESEND_API_KEY = 'test-key';
  await assert.rejects(sendAuthEmail('user@example.test', 'subject', 'https://example.test'), /chưa được cấu hình/);
  assert.equal(fetchMock.mock.callCount(), 0);
  process.env.EMAIL_FROM = 'sender@example.test';
  await assert.rejects(sendAuthEmail('user@example.test', 'subject', 'https://example.test'), /từ chối/);
  assert.equal(fetchMock.mock.callCount(), 1);
});
