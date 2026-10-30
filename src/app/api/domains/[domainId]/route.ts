import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import type { Prisma } from '../../../../../generated/prisma/client';
import { auditPayload, getRequestIp, requireDnsUser, validDomainName } from '../../../../lib/dns-api';

type Context = { params: Promise<{ domainId: string }> };

export async function GET(_request: Request, context: Context) {
  const { userId } = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { domainId } = await context.params;
  const domain = await prisma.domain.findFirst({ where: { id: domainId, userId }, include: { records: true } });
  if (!domain) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  return NextResponse.json({ domain });
}

export async function PATCH(request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId } = await context.params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const existing = await prisma.domain.findFirst({ where: { id: domainId, userId } });
  if (!existing) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (!validDomainName(body.name)) return NextResponse.json({ error: 'Tên domain không hợp lệ.' }, { status: 400 });
    data.name = body.name.trim().toLowerCase().replace(/\.$/, '');
  }
  if (body.nameservers !== undefined) {
    if (!Array.isArray(body.nameservers) || body.nameservers.some(v => typeof v !== 'string' || v.length > 253)) return NextResponse.json({ error: 'Nameservers không hợp lệ.' }, { status: 400 });
    data.nameservers = body.nameservers.slice(0, 20);
  }
  if (typeof body.registrar === 'string' || body.registrar === null) data.registrar = body.registrar;
  if (typeof body.autoRenew === 'boolean') data.autoRenew = body.autoRenew;
  if (typeof body.dnssec === 'boolean') data.dnssec = body.dnssec;
  if (typeof body.environment === 'string' && ['production','staging','internal','client_projects'].includes(body.environment)) data.environment = body.environment;
  try {
    const domain = await prisma.$transaction(async tx => {
      const updated = await tx.domain.update({ where: { id: domainId }, data: data as Prisma.DomainUpdateInput });
      await tx.auditLog.create({ data: { userId, domainId, action: 'DOMAIN_UPDATED', details: `Updated domain ${updated.name}`, ipAddress: getRequestIp(request), before: auditPayload(existing), after: auditPayload(updated) } });
      return updated;
    });
    return NextResponse.json({ domain });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'Domain này đã tồn tại trong tài khoản.' }, { status: 409 });
    return NextResponse.json({ error: 'Không thể cập nhật domain.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const { domainId } = await context.params;
  const existing = await prisma.domain.findFirst({ where: { id: domainId, userId } });
  if (!existing) return NextResponse.json({ error: 'Domain không tồn tại.' }, { status: 404 });
  await prisma.$transaction(async tx => {
    await tx.auditLog.create({ data: { userId, action: 'DOMAIN_DELETED', details: `Deleted domain ${existing.name}`, ipAddress: getRequestIp(request), before: auditPayload(existing) } });
    await tx.domain.delete({ where: { id: domainId } });
  });
  return NextResponse.json({ ok: true });
}
