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

test('enforces DNS label and full-name length limits', () => {
  assert.equal(validDomainName(`${'a'.repeat(63)}.example`), true);
  assert.equal(validDomainName(`${'a'.repeat(64)}.example`), false);
  const longestName = `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;
  assert.equal(longestName.length, 253);
  assert.equal(validDomainName(longestName), true);
  assert.equal(validDomainName(`${longestName}x`), false);
});

test('normalizes surrounding whitespace and a single root dot, but rejects invalid labels', () => {
  assert.equal(validDomainName('  Sub.Example.COM.  '), true);
  for (const value of ['example.com..', '.example.com', 'exa_mple.com', 'example. com', 'éxample.com']) {
    assert.equal(validDomainName(value), false, value);
  }
});

test('accepts every supported record type case-insensitively', () => {
  for (const type of ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR', 'SOA', 'ALIAS']) {
    assert.equal(validRecordType(type.toLowerCase()), true, type);
  }
  for (const value of ['', ' A', 'A ', 'HTTPS', 1, undefined]) {
    assert.equal(validRecordType(value), false, String(value));
  }
});

test('rejects TTLs that are not finite integers, including numeric strings', () => {
  for (const value of ['60', null, undefined, NaN, Infinity, -Infinity, -1, 0]) {
    assert.equal(validTtl(value), false, String(value));
  }
});
