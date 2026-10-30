import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import type { Prisma } from '../../../../generated/prisma/client';
import { getRequestIp, requireDnsUser } from '../../../lib/dns-api';

const clientActions = new Set([
  'ROLLBACK',
  'REGISTRAR_SYNC',
  'SSL_RENEWED',
  '2FA_ENABLED',
  'ROLE_CHANGED',
  'MEMBER_INVITED',
  'DDNS_AUTO_UPDATE',
]);

const actionLabels: Record<string, string> = {
  DOMAIN_CREATED: 'DOMAIN_ADDED',
  DNS_RECORD_CREATED: 'CREATE_RECORD',
  DNS_RECORD_UPDATED: 'UPDATE_RECORD',
  DNS_RECORD_DELETED: 'DELETE_RECORD',
};

type AuditLogWithRelations = Prisma.AuditLogGetPayload<{ include: { user: { select: { name: true; email: true; image: true } }; domain: { select: { name: true } } } }>;

function toAuditEntry(log: AuditLogWithRelations) {
  const before = log.before && typeof log.before === 'object' ? log.before : undefined;
  const after = log.after && typeof log.after === 'object' ? log.after : undefined;
  const record = (after && !Array.isArray(after) ? after : undefined) ?? (before && !Array.isArray(before) ? before : undefined);
  return {
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    actor: {
      name: log.user?.name || 'Cloudxx user',
      email: log.user?.email || '',
      role: 'Account member',
      avatar: log.user?.image || '',
    },
    ipAddress: log.ipAddress || '',
    action: actionLabels[log.action] || log.action,
    domainName: log.domain?.name || (typeof record?.domainName === 'string' ? record.domainName : 'Global'),
    recordName: typeof record?.name === 'string' ? record.name : undefined,
    recordType: typeof record?.type === 'string' ? record.type : undefined,
    details: log.details,
    diff: before || after ? { before, after } : undefined,
    rollbackable: false,
  };
}

export async function GET(request: Request) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('limit') ?? 50);
  const limit = Number.isInteger(requested) ? Math.min(100, Math.max(1, requested)) : 50;
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    include: { user: { select: { name: true, email: true, image: true } }, domain: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ logs: logs.map(toAuditEntry) });
}

export async function POST(request: Request) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  if (typeof body.action !== 'string' || !clientActions.has(body.action)) {
    return NextResponse.json({ error: 'Audit action is not allowed.' }, { status: 400 });
  }
  if (typeof body.details !== 'string' || !body.details.trim() || body.details.length > 2000) {
    return NextResponse.json({ error: 'Audit details are required and must be under 2000 characters.' }, { status: 400 });
  }

  const domainName = typeof body.domainName === 'string' ? body.domainName.slice(0, 253) : 'Global';
  const systemScopes = new Set(['Global', 'Security System', 'System Team', 'System Backup']);
  const domain = domainName && !systemScopes.has(domainName)
    ? await prisma.domain.findFirst({ where: { userId, name: domainName }, select: { id: true } })
    : null;
  if (domainName && !systemScopes.has(domainName) && !domain) {
    return NextResponse.json({ error: 'Domain không tồn tại hoặc không thuộc tài khoản.' }, { status: 404 });
  }

  const safeJson = (value: unknown): Prisma.InputJsonValue | undefined => {
    if (value === undefined) return undefined;
    try {
      const encoded = JSON.stringify(value);
      if (encoded.length > 12000) return undefined;
      return JSON.parse(encoded) as Prisma.InputJsonValue;
    } catch { return undefined; }
  };

  const log = await prisma.auditLog.create({
    data: {
      userId,
      domainId: domain?.id,
      action: body.action,
      details: body.details.trim(),
      ipAddress: getRequestIp(request),
      before: safeJson(body.before),
      after: safeJson(body.after ?? {
        domainName,
        name: typeof body.recordName === 'string' ? body.recordName.slice(0, 253) : undefined,
        type: typeof body.recordType === 'string' ? body.recordType.slice(0, 10) : undefined,
      }),
    },
  });
  return NextResponse.json({ ok: true, id: log.id }, { status: 201 });
}
