import test from 'node:test';
import assert from 'node:assert/strict';
import { validDomainName, validRecordType, validTtl } from '../src/lib/dns-validation';

test('accepts valid normalized domain labels', () => {
  assert.equal(validDomainName('example.com'), true);
  assert.equal(validDomainName('Sub.Example.com.'), true);
  assert.equal(validDomainName('example-domain.vn'), true);
});

test('rejects malformed domain names', () => {
  for (const value of ['', 'localhost', '-bad.example', 'bad-.example', 'a..example', 'example..com', 'https://example.com', 42, null]) {
    assert.equal(validDomainName(value), false, String(value));
  }
});

test('accepts only supported DNS record types', () => {
  assert.equal(validRecordType('A'), true);
  assert.equal(validRecordType('aaaa'), true);
  assert.equal(validRecordType('HTTPS'), false);
  assert.equal(validRecordType(null), false);
});

test('enforces safe TTL bounds', () => {
  assert.equal(validTtl(60), true);
  assert.equal(validTtl(86400), true);
  assert.equal(validTtl(59), false);
  assert.equal(validTtl(86401), false);
  assert.equal(validTtl(300.5), false);
});
