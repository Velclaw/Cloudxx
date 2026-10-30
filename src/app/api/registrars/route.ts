import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getRequestIp, requireDnsUser } from '../../../../lib/dns-api';

const providers = ['Cloudflare','AWS Route 53','Namecheap','GoDaddy','DigitalOcean','Google Cloud','Porkbun'];

export async function GET() {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  const registrars = await prisma.registrar.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ registrars });
}

export async function POST(request: Request) {
  const { userId, response } = await requireDnsUser();
  if (response || !userId) return response;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (typeof body.provider !== 'string' || !providers.includes(body.provider) || typeof body.displayName !== 'string' || !body.displayName.trim() || body.displayName.length > 100) {
    return NextResponse.json({ error: 'Registrar provider hoặc tên kết nối không hợp lệ.' }, { status: 400 });
  }
  try {
    const registrar = await prisma.registrar.create({ data: {
      userId, provider: body.provider, displayName: body.displayName.trim(),
      accountEmail: typeof body.accountEmail === 'string' ? body.accountEmail.slice(0,254) : null,
      status: 'disconnected',
    }});
    await prisma.auditLog.create({ data: { userId, action: 'REGISTRAR_CREATED', details: `Added registrar connection metadata: ${registrar.provider}`, ipAddress: getRequestIp(request) } });
    return NextResponse.json({ registrar }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: 'Kết nối registrar đã tồn tại.' }, { status: 409 });
    return NextResponse.json({ error: 'Không thể tạo kết nối registrar.' }, { status: 500 });
  }
}
