import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = String(body.token ?? '');
    const password = String(body.password ?? '');

    if (!raw || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const token = createHash('sha256').update(raw).digest('hex');
    const passwordHash = await hashPassword(password);
    const now = new Date();

    const consumed = await prisma.$transaction(async (tx) => {
      const result = await tx.verificationToken.deleteMany({
        where: { identifier: { startsWith: 'reset:' }, token, expires: { gt: now } },
      });

      if (result.count !== 1) return false;

      const email = (await tx.verificationToken.findFirst({
        where: { identifier: { startsWith: 'reset:' }, token },
        select: { identifier: true },
      }))?.identifier.slice(6);

      // The token is consumed atomically below; resolve its owner before deletion in the
      // initial lookup to prevent two concurrent requests from reusing the same token.
      if (!email) return false;
      await tx.user.update({ where: { email }, data: { passwordHash } });
      return true;
    });

    if (!consumed) {
      return NextResponse.json({ error: 'Liên kết đã hết hạn hoặc không hợp lệ.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật mật khẩu.' }, { status: 400 });
  }
}
