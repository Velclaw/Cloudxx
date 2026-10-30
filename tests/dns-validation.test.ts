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

test('enforces DNS name and label length limits', () => {
  const label63 = 'a'.repeat(63);
  const name253 = [label63, label63, label63, 'a'.repeat(61)].join('.');
  assert.equal(name253.length, 253);
  assert.equal(validDomainName(name253), true);
  assert.equal(validDomainName(`${name253}a`), false);
  assert.equal(validDomainName(`${'a'.repeat(64)}.example`), false);
  assert.equal(validDomainName('a.example.'), true);
  assert.equal(validDomainName('a.example..'), false);
});

test('accepts every supported record type case-insensitively and rejects invalid values', () => {
  for (const type of ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR', 'SOA', 'ALIAS']) {
    assert.equal(validRecordType(type.toLowerCase()), true, type);
  }
  for (const type of ['', ' A', 'A ', 'HTTPS', 1, undefined]) {
    assert.equal(validRecordType(type), false, String(type));
  }
});

test('rejects non-integer and non-numeric TTL inputs at the boundaries', () => {
  for (const ttl of ['60', null, undefined, NaN, Infinity, -1, 59, 86401, 60.1]) {
    assert.equal(validTtl(ttl), false, String(ttl));
  }
  assert.equal(validTtl(60), true);
  assert.equal(validTtl(86400), true);
});
