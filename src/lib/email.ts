export async function sendAuthEmail(to: string, subject: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('Email chưa được cấu hình.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to, subject,
      html: `<main style="font-family:Arial,sans-serif"><h2>Cloudxx</h2><p>${subject}</p><p><a href="${url}">Tiếp tục</a></p><p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p></main>`,
      text: `${subject}\n\n${url}\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email.`,
    }),
  });
  if (!response.ok) throw new Error('Nhà cung cấp email từ chối yêu cầu gửi thư.');
}
