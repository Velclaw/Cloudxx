import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireDnsUser } from '../../../../../lib/dns-api';
import { decryptCredentials } from '../../../../../lib/credential-crypto';

type Context = { params: Promise<{ domainId: string }> };
const CF_API = 'https://api.cloudflare.com/client/v4';

export async function GET(_request: Request, context: Context) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { domainId } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id: domainId, userId } });
  if (!domain) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  const registrar = await prisma.registrar.findFirst({ where: { userId, provider: 'Cloudflare', encryptedCredentials: { not: null } }, orderBy: { updatedAt: 'desc' } });
  if (!registrar?.encryptedCredentials) return NextResponse.json({ error: 'Chưa cấu hình Cloudflare credential.' }, { status: 409 });
  let token: string;
  try { token = decryptCredentials(registrar.encryptedCredentials).apiToken || ''; }
  catch { return NextResponse.json({ error: 'Không thể giải mã Cloudflare credential.' }, { status: 503 }); }
  if (!token) return NextResponse.json({ error: 'Cloudflare API token không tồn tại.' }, { status: 503 });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const zoneResponse = await fetch(`${CF_API}/zones?name=${encodeURIComponent(domain.name)}&status=active`, { headers, cache: 'no-store' });
  const zonePayload = await zoneResponse.json() as { success?: boolean; errors?: Array<{ message?: string }>; result?: Array<{ id: string; name: string }> };
  if (!zoneResponse.ok || !zonePayload.success || !zonePayload.result?.[0]) return NextResponse.json({ error: zonePayload.errors?.[0]?.message || 'Không tìm thấy Cloudflare zone hoặc token thiếu quyền Zone:Read.' }, { status: 502 });
  const zone = zonePayload.result[0];
  const recordsResponse = await fetch(`${CF_API}/zones/${zone.id}/dns_records?per_page=100`, { headers, cache: 'no-store' });
  const recordsPayload = await recordsResponse.json() as { success?: boolean; errors?: Array<{ message?: string }>; result?: unknown[] };
  if (!recordsResponse.ok || !recordsPayload.success) return NextResponse.json({ error: recordsPayload.errors?.[0]?.message || 'Không thể đọc DNS records từ Cloudflare.' }, { status: 502 });
  return NextResponse.json({ zone: { id: zone.id, name: zone.name }, records: recordsPayload.result || [] });
}

export async function POST(request: Request, context: Context) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { domainId } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id: domainId, userId } });
  if (!domain) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (typeof body.type !== 'string' || !['A','AAAA','CNAME','MX','TXT','NS','SRV','CAA'].includes(body.type.toUpperCase()) || typeof body.name !== 'string' || !body.name.trim() || typeof body.content !== 'string' || !body.content.trim()) return NextResponse.json({ error: 'DNS record không hợp lệ.' }, { status: 400 });
  const registrar = await prisma.registrar.findFirst({ where: { userId, provider: 'Cloudflare', encryptedCredentials: { not: null } }, orderBy: { updatedAt: 'desc' } });
  if (!registrar?.encryptedCredentials) return NextResponse.json({ error: 'Chưa cấu hình Cloudflare credential.' }, { status: 409 });
  let token: string;
  try { token = decryptCredentials(registrar.encryptedCredentials).apiToken || ''; } catch { return NextResponse.json({ error: 'Không thể giải mã Cloudflare credential.' }, { status: 503 }); }
  if (!token) return NextResponse.json({ error: 'Cloudflare API token không tồn tại.' }, { status: 503 });
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const zones = await fetch(`${CF_API}/zones?name=${encodeURIComponent(domain.name)}&status=active`, { headers, cache: 'no-store' });
  const zonePayload = await zones.json() as { success?: boolean; result?: Array<{ id: string }> };
  const zoneId = zonePayload.result?.[0]?.id;
  if (!zones.ok || !zonePayload.success || !zoneId) return NextResponse.json({ error: 'Không tìm thấy zone Cloudflare cho domain.' }, { status: 502 });
  const ttl = Number(body.ttl ?? 300);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) return NextResponse.json({ error: 'TTL phải từ 60 đến 86400.' }, { status: 400 });
  const cfResponse = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, { method: 'POST', headers, body: JSON.stringify({ type: body.type.toUpperCase(), name: body.name.trim(), content: body.content.trim(), ttl, proxied: body.proxied === true }) });
  const payload = await cfResponse.json() as { success?: boolean; errors?: Array<{ message?: string }>; result?: unknown };
  if (!cfResponse.ok || !payload.success) return NextResponse.json({ error: payload.errors?.[0]?.message || 'Cloudflare DNS write failed.' }, { status: 502 });
  return NextResponse.json({ record: payload.result }, { status: 201 });
}
