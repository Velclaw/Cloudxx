function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

export function getAuthBaseUrl(request: Request): URL {
  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (configuredUrl) {
    const url = new URL(configuredUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('AUTH_URL must use HTTP or HTTPS.');
    }
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('AUTH_URL must use HTTPS in production.');
    }
    return url;
  }

  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configure AUTH_URL before sending authentication emails.');
  }

  return new URL(request.url).origin === 'null'
    ? new URL('http://localhost:3000')
    : new URL(request.url);
}

export async function sendAuthEmail(to: string, subject: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Email chưa được cấu hình.');

  const safeSubject = escapeHtml(subject);
  const safeUrl = escapeHtml(url);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<main style="font-family:Arial,sans-serif"><h2>Cloudxx</h2><p>${safeSubject}</p><p><a href="${safeUrl}">Tiếp tục</a></p><p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p></main>`,
      text: `${subject}\n\n${url}\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email.`,
    }),
  });

  if (!response.ok) {
    throw new Error('Nhà cung cấp email từ chối yêu cầu gửi thư.');
  }
}
