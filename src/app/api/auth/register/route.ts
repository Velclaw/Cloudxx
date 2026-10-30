import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/password';
import { sendAuthEmail } from '../../../../lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.fullName ?? '').trim();

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không hợp lệ.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    // Do not reveal whether an address already has an account. An unverified
    // credentials account may request a fresh verification link without changing
    // its existing password.
    if (existing?.emailVerified || (existing && !existing.passwordHash)) {
      return NextResponse.json({ ok: true });
    }

    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          name: name.slice(0, 100),
          passwordHash: await hashPassword(password),
        },
      });
    }

    const raw = randomBytes(32).toString('hex');
    const token = createHash('sha256').update(raw).digest('hex');
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    const baseUrl = process.env.AUTH_URL || new URL(request.url).origin;
    const verificationUrl = new URL('/api/auth/verify-email', baseUrl);
    verificationUrl.searchParams.set('token', raw);
    verificationUrl.searchParams.set('email', email);

    await sendAuthEmail(email, 'Xác minh email Cloudxx', verificationUrl.toString());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể đăng ký hoặc gửi email xác minh. Kiểm tra cấu hình email.' }, { status: 500 });
  }
}
