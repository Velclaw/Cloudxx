import { createHash } from 'node:crypto';
import { prisma } from './prisma';

export async function consumeAuthRateLimit(
  request: { headers: Headers },
  scope: string,
  maxAttempts: number,
  windowMs: number,
): Promise<boolean> {
  // x-real-ip is set by the trusted hosting proxy; do not trust client-supplied X-Forwarded-For.
  const address = request.headers.get('x-real-ip') ?? 'unknown';
  const key = createHash('sha256').update(`${scope}:${address}`).digest('hex');
  const now = new Date();
  const windowExpiredBefore = new Date(now.getTime() - windowMs);

  const rows = await prisma.$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO "AuthRateLimit" ("key", "windowStartedAt", "attempts", "updatedAt")
    VALUES (${key}, ${now}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE
        WHEN "AuthRateLimit"."windowStartedAt" <= ${windowExpiredBefore} THEN 1
        ELSE "AuthRateLimit"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "AuthRateLimit"."windowStartedAt" <= ${windowExpiredBefore} THEN ${now}
        ELSE "AuthRateLimit"."windowStartedAt"
      END,
      "updatedAt" = ${now}
    RETURNING "attempts"
  `;

  return (rows[0]?.attempts ?? maxAttempts + 1) <= maxAttempts;
}
