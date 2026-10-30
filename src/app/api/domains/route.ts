import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { auditPayload, getRequestIp, requireDnsUser, validDomainName } from '../../../lib/dns-api';

export async function GET() {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const domains = await prisma.domain.findMany({
    where: { userId },
    include: { records: { orderBy: [{ name: 'asc' }, { type: 'asc' }] } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!validDomainName(body.name)) return NextResponse.json({ error: 'Tên domain không hợp lệ.' }, { status: 400 });
  const name = body.name.trim().toLowerCase().replace(/\.$/, '');
  const nameservers = Array.isArray(body.nameservers)
    ? body.nameservers.filter((v): v is string => typeof v === 'string' && v.length <= 253).slice(0, 20)
    : [];
  try {
    const domain = await prisma.$transaction(async tx => {
      const created = await tx.domain.create({
        data: {
          userId, name, registrar: typeof body.registrar === 'string' ? body.registrar.slice(0, 80) : null,
          status: 'active', autoRenew: body.autoRenew === true, nameservers,
          dnssec: body.dnssec === true,
          environment: typeof body.environment === 'string' && ['production','staging','internal','client_projects'].includes(body.environment) ? body.environment : 'production',
        },
      });
      await tx.auditLog.create({ data: { userId, domainId: created.id, action: 'DOMAIN_CREATED', details: `Created domain ${name}`, ipAddress: getRequestIp(request), after: auditPayload({ name, nameservers }) } });
      return created;
    });
    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'Domain này đã tồn tại trong tài khoản.' }, { status: 409 });
    return NextResponse.json({ error: 'Không thể tạo domain.' }, { status: 500 });
  }
}
