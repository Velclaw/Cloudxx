import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import { getAuthBaseUrl } from '../../../../lib/email';

export async function GET(request: Request) {
  let redirectBase: URL;
  try {
    redirectBase = getAuthBaseUrl();
  } catch {
    return NextResponse.json({ error: 'AUTH_URL chưa được cấu hình an toàn.' }, { status: 500 });
  }

  const raw = new URL(request.url).searchParams.get('token') ?? '';
  const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
  const invalidUrl = new URL('/?verified=invalid', redirectBase);

  if (!raw || !email) {
    return NextResponse.redirect(invalidUrl);
  }

  try {
    const token = createHash('sha256').update(raw).digest('hex');
    const now = new Date();

    const verified = await prisma.$transaction(async (tx) => {
      const result = await tx.verificationToken.deleteMany({
        where: { identifier: email, token, expires: { gt: now } },
      });

      if (result.count !== 1) return false;

      await tx.user.update({
        where: { email },
        data: { emailVerified: now },
      });
      return true;
    });

    return NextResponse.redirect(new URL(verified ? '/?verified=success' : '/?verified=invalid', redirectBase));
  } catch {
    return NextResponse.redirect(invalidUrl);
  }
}
