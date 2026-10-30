import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get('token') ?? '';
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  if (!raw || !email) {
    return NextResponse.redirect(new URL('/?verified=invalid', url));
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

    return NextResponse.redirect(new URL(verified ? '/?verified=success' : '/?verified=invalid', url));
  } catch {
    return NextResponse.redirect(new URL('/?verified=invalid', url));
  }
}
