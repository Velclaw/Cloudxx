import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import type { Prisma } from '../../../../../../../generated/prisma/client';
import { auditPayload, getRequestIp, requireDnsUser, validRecordType } from '../../../../../../lib/dns-api';

type Context = { params: Promise<{ domainId: string; recordId: string }> };

export async function PATCH(request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId, recordId } = await context.params;
  const existing = await prisma.dNSRecord.findFirst({ where: { id: recordId, domainId, domain: { userId } } });
  if (!existing) return NextResponse.json({ error: 'DNS record không tồn tại.' }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const data: Record<string, unknown> = {};
  if (body.type !== undefined) {
    if (!validRecordType(body.type)) return NextResponse.json({ error: 'Record type không hợp lệ.' }, { status: 400 });
    data.type = body.type.toUpperCase();
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 253) return NextResponse.json({ error: 'Record name không hợp lệ.' }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || !body.content.trim() || body.content.length > 4096) return NextResponse.json({ error: 'Record content không hợp lệ.' }, { status: 400 });
    data.content = body.content.trim();
  }
  if (body.ttl !== undefined || body.ttlAuto !== undefined) {
    const auto = body.ttl === 'Auto' || body.ttlAuto === true;
    const ttl = auto ? 300 : Number(body.ttl);
    if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) return NextResponse.json({ error: 'TTL không hợp lệ.' }, { status: 400 });
    data.ttl = ttl; data.ttlAuto = auto;
  }
  for (const field of ['priority','port','weight'] as const) if (body[field] === null || Number.isInteger(body[field])) data[field] = body[field];
  if (typeof body.proxied === 'boolean') data.proxied = body.proxied;
  if (typeof body.comment === 'string' || body.comment === null) data.comment = body.comment;
  const record = await prisma.$transaction(async tx => {
    const updated = await tx.dNSRecord.update({ where: { id: recordId }, data: data as Prisma.DNSRecordUpdateInput });
    await tx.auditLog.create({ data: { userId, domainId, action: 'DNS_RECORD_UPDATED', details: `Updated ${updated.type} record ${updated.name}`, ipAddress: getRequestIp(request), before: auditPayload(existing), after: auditPayload(updated) } });
    return updated;
  });
  return NextResponse.json({ record });
}

export async function DELETE(request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId, recordId } = await context.params;
  const existing = await prisma.dNSRecord.findFirst({ where: { id: recordId, domainId, domain: { userId } } });
  if (!existing) return NextResponse.json({ error: 'DNS record không tồn tại.' }, { status: 404 });
  await prisma.$transaction(async tx => {
    await tx.auditLog.create({ data: { userId, domainId, action: 'DNS_RECORD_DELETED', details: `Deleted ${existing.type} record ${existing.name}`, ipAddress: getRequestIp(request), before: auditPayload(existing) } });
    await tx.dNSRecord.delete({ where: { id: recordId } });
  });
  return NextResponse.json({ ok: true });
}
