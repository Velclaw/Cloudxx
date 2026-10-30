export function validDomainName(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 253) return false;
  const name = value.trim().toLowerCase().replace(/\.$/, '');
  return name.length > 0 && name.split('.').length >= 2 &&
    name.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

export function validRecordType(value: unknown): value is string {
  return typeof value === 'string' && ['A','AAAA','CNAME','MX','TXT','NS','SRV','CAA','PTR','SOA','ALIAS'].includes(value.toUpperCase());
}

export function validTtl(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 60 && Number(value) <= 86400;
}
