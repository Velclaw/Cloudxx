import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, getAuthBaseUrl, sendAuthEmail } from '../src/lib/email';

const envKeys = ['AUTH_URL', 'NEXTAUTH_URL', 'VERCEL_URL', 'NODE_ENV', 'RESEND_API_KEY', 'EMAIL_FROM'] as const;

function withEnvironment(values: Partial<Record<(typeof envKeys)[number], string>>, run: () => void | Promise<void>) {
  const env: Record<string, string | undefined> = process.env;
  const previous = Object.fromEntries(envKeys.map(key => [key, env[key]]));
  for (const key of envKeys) {
    if (values[key] === undefined) delete env[key];
    else env[key] = values[key];
  }
  return Promise.resolve().then(run).finally(() => {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete env[key];
      else env[key] = previous[key];
    }
  });
}

test('escapes every HTML special character without changing ordinary text', () => {
  assert.equal(escapeHtml(`Cloudxx & <tag> "quoted" 'value'`), 'Cloudxx &amp; &lt;tag&gt; &quot;quoted&quot; &#39;value&#39;');
});

test('chooses the configured authentication URL in priority order', async () => {
  await withEnvironment({ AUTH_URL: 'https://auth.example/path', NEXTAUTH_URL: 'https://next.example', VERCEL_URL: 'preview.example' }, () => {
    assert.equal(getAuthBaseUrl().href, 'https://auth.example/path');
  });
  await withEnvironment({ NEXTAUTH_URL: 'https://next.example', VERCEL_URL: 'preview.example' }, () => {
    assert.equal(getAuthBaseUrl().origin, 'https://next.example');
  });
  await withEnvironment({ VERCEL_URL: 'preview.example' }, () => {
    assert.equal(getAuthBaseUrl().origin, 'https://preview.example');
  });
});

test('rejects absent, malformed, non-HTTP and insecure production URLs', async () => {
  await withEnvironment({}, () => assert.throws(getAuthBaseUrl, /Configure AUTH_URL/));
  await withEnvironment({ AUTH_URL: 'not a url' }, () => assert.throws(getAuthBaseUrl));
  await withEnvironment({ AUTH_URL: 'javascript:alert(1)' }, () => assert.throws(getAuthBaseUrl, /HTTP or HTTPS/));
  await withEnvironment({ AUTH_URL: 'http://example.com', NODE_ENV: 'production' }, () => assert.throws(getAuthBaseUrl, /HTTPS in production/));
  await withEnvironment({ AUTH_URL: 'http://localhost:3000', NODE_ENV: 'development' }, () => assert.equal(getAuthBaseUrl().origin, 'http://localhost:3000'));
});

test('sends a Resend message with escaped HTML and unmodified text', async t => {
  await withEnvironment({ RESEND_API_KEY: 'test-key', EMAIL_FROM: 'sender@example.test' }, async () => {
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 202 }));
    const subject = `Verify <account> & "email"`;
    const url = `https://example.test/?a=1&b="2"`;
    await sendAuthEmail('user@example.test', subject, url);
    assert.equal(fetchMock.mock.calls.length, 1);
    const [endpoint, options] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
    assert.equal(endpoint, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.headers, { Authorization: 'Bearer test-key', 'Content-Type': 'application/json' });
    const body = JSON.parse(String(options.body));
    assert.equal(body.from, 'sender@example.test');
    assert.equal(body.to, 'user@example.test');
    assert.equal(body.subject, subject);
    assert.match(body.html, /Verify &lt;account&gt; &amp; &quot;email&quot;/);
    assert.match(body.html, /href="https:\/\/example.test\/\?a=1&amp;b=&quot;2&quot;"/);
    assert.ok(body.text.includes(`${subject}\n\n${url}`));
  });
});

test('fails before sending when email is unconfigured and reports provider failures', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 503 }));
  await withEnvironment({ EMAIL_FROM: 'sender@example.test' }, async () => {
    await assert.rejects(sendAuthEmail('user@example.test', 'subject', 'https://example.test'), /chưa được cấu hình/);
    assert.equal(fetchMock.mock.calls.length, 0);
  });
  await withEnvironment({ RESEND_API_KEY: 'test-key', EMAIL_FROM: 'sender@example.test' }, async () => {
    await assert.rejects(sendAuthEmail('user@example.test', 'subject', 'https://example.test'), /từ chối/);
  });
});
