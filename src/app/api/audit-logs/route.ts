import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireDnsUser } from '../../../lib/dns-api';

export async function GET(request: Request) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get('limit') ?? 50);
  const limit = Number.isInteger(requested) ? Math.min(100, Math.max(1, requested)) : 50;
  const logs = await prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
  return NextResponse.json({ logs });
}
