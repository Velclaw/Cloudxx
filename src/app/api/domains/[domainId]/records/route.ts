import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { auditPayload, getRequestIp, requireDnsUser, validRecordType } from '../../../../../lib/dns-api';

type Context = { params: Promise<{ domainId: string }> };

export async function GET(_request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id: domainId, userId }, select: { id: true } });
  if (!domain) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  const records = await prisma.dNSRecord.findMany({ where: { domainId }, orderBy: [{ name: 'asc' }, { type: 'asc' }] });
  return NextResponse.json({ records });
}

export async function POST(request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id: domainId, userId } });
  if (!domain) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!validRecordType(body.type) || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 253 || typeof body.content !== 'string' || !body.content.trim() || body.content.length > 4096) {
    return NextResponse.json({ error: 'DNS record không hợp lệ.' }, { status: 400 });
  }
  const ttl = body.ttl === 'Auto' || body.ttlAuto === true ? 300 : Number(body.ttl ?? 300);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) return NextResponse.json({ error: 'TTL phải từ 60 đến 86400 giây.' }, { status: 400 });
  const record = await prisma.$transaction(async tx => {
    const created = await tx.dNSRecord.create({ data: {
      domainId, type: body.type.toUpperCase(), name: body.name.trim(), content: body.content.trim(),
      ttl, ttlAuto: body.ttl === 'Auto' || body.ttlAuto === true,
      priority: Number.isInteger(body.priority) ? Number(body.priority) : null,
      port: Number.isInteger(body.port) ? Number(body.port) : null,
      weight: Number.isInteger(body.weight) ? Number(body.weight) : null,
      proxied: body.proxied === true, comment: typeof body.comment === 'string' ? body.comment.slice(0, 1000) : null,
    }});
    await tx.auditLog.create({ data: { userId, domainId, action: 'DNS_RECORD_CREATED', details: `Created ${created.type} record ${created.name}`, ipAddress: getRequestIp(request), after: auditPayload(created) } });
    return created;
  });
  return NextResponse.json({ record }, { status: 201 });
}
