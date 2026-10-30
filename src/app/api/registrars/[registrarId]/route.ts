import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getRequestIp, requireDnsUser } from '../../../../lib/dns-api';

type Context = { params: Promise<{ registrarId: string }> };

export async function PATCH(request: Request, context: Context) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { registrarId } = await context.params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const existing = await prisma.registrar.findFirst({ where: { id: registrarId, userId } });
  if (!existing) return NextResponse.json({ error: 'Registrar không tồn tại.' }, { status: 404 });
  const data: { displayName?: string; accountEmail?: string | null } = {};
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== 'string' || !body.displayName.trim() || body.displayName.length > 100) return NextResponse.json({ error: 'Tên kết nối không hợp lệ.' }, { status: 400 });
    data.displayName = body.displayName.trim();
  }
  if (typeof body.accountEmail === 'string' || body.accountEmail === null) data.accountEmail = body.accountEmail;
  const registrar = await prisma.registrar.update({ where: { id: registrarId }, data });
  await prisma.auditLog.create({ data: { userId, action: 'REGISTRAR_UPDATED', details: `Updated registrar connection metadata: ${registrar.provider}`, ipAddress: getRequestIp(request) } });
  return NextResponse.json({ registrar });
}

export async function DELETE(request: Request, context: Context) {
  const userId = await requireDnsUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { registrarId } = await context.params;
  const existing = await prisma.registrar.findFirst({ where: { id: registrarId, userId } });
  if (!existing) return NextResponse.json({ error: 'Registrar không tồn tại.' }, { status: 404 });
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId, action: 'REGISTRAR_DELETED', details: `Removed registrar connection metadata: ${existing.provider}`, ipAddress: getRequestIp(request) } }),
    prisma.registrar.delete({ where: { id: registrarId } }),
  ]);
  return NextResponse.json({ ok: true });
}
