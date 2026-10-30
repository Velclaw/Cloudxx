# Cloudxx — Quản lý DNS & Tên miền

React + TypeScript + Vite dashboard prototype for DNS zones, records, registrar connections, alerts, audit history, team roles, backups, and API access.

> **Current maturity: UI prototype / local demo.** DNS data and provider integrations remain demo/local state. The authentication and user-profile flow is being introduced separately; it does not make DNS changes live.

## Stack

- React 19, TypeScript, Vite 8, Tailwind CSS 4
- Supabase Auth for email/password identity and session management
- Supabase Postgres for user profiles, protected with Row Level Security (RLS)
- Vercel static deployment; optional GitHub Pages static hosting

## Requirements

- Node.js 22.12+ and npm

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Set these browser-safe build variables in `.env` or the hosting provider:

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (not a secret key)

The publishable key is intended for browser applications. **Never** put a Supabase secret/service_role key in a `VITE_*` variable, source file, or GitHub repository.

## Authentication setup

1. In Supabase Authentication > URL Configuration, add the deployed site URL to **Site URL** and **Redirect URLs**. For GitHub Pages use `https://zskbot.github.io/Cloudxx/`; for Vercel add the Preview and Production URLs you intend to use.
2. Enable email/password sign-up and configure SMTP/email delivery and email confirmation as required.
3. Apply `supabase/migrations/202610300001_profiles.sql` to the selected Supabase project. It creates `public.profiles`, a signup trigger, and owner-only RLS policies.
4. Add the two `VITE_SUPABASE_*` variables to the hosting build environment and rebuild the site.
5. Register using an email address you control, verify the email, then sign in.

The login screen starts with `huynhthuong.xyz@gmail.com` prefilled as requested; this does not create an account or bypass email verification. The user must choose and keep their own password.

## Social sign-in (GitHub and Google)

The login screen supports Supabase Auth OAuth for GitHub and Google. Enable each provider in Supabase Dashboard > Authentication > Sign In / Providers and enter the corresponding OAuth client ID and client secret there (never in this repository or any `VITE_*` variable).

For each OAuth app, register the Supabase project's callback URL shown in its provider settings (typically `https://<project-ref>.supabase.co/auth/v1/callback`). In Supabase Authentication > URL Configuration, allow the deployed Cloudxx origin and the exact redirect URL used by the app.

The URL `https://cloudxx.velclaw.app/api/v1/auth/oauth/github/callback` is a separate backend callback. It is not interchangeable with Supabase's callback URL. The current Cloudxx source uses Supabase Auth for session management and does not contain a verified backend OAuth route or session-exchange contract. Do not configure the provider to call both callbacks or paste OAuth client secrets into source files. A separate backend OAuth flow requires a working server endpoint and a secure, documented way to establish the same application session.

## Profile data and authorization

The profile table stores full name, username, phone, avatar URL, and timestamps. RLS permits authenticated users to select, insert, and update only the row whose `id` equals `auth.uid()`. Anonymous access is revoked. The database trigger creates a profile row for new Auth users.

## Quality checks

```bash
npm run typecheck
npm run build
```

GitHub Actions runs type-check and production build for pull requests and pushes. A successful frontend build does not prove email delivery, Supabase Auth settings, or live DNS operations work.

## DNS / Cloudflare integration — implementation boundary

The current frontend seeds example DNS data. No DNS change is sent to Cloudflare, a registrar, or another provider by the current frontend. A production integration must use server-side provider credentials, least-privilege tokens, server-side RBAC, explicit confirmation for destructive operations, audit logs, rate limits, and integration tests.

## Security notes

- Browser localStorage is not a secure database and must not store provider API tokens, registrar secrets, 2FA secrets, or backup codes.
- The current 2FA settings and API token screens remain demo state, not real MFA or token issuance.
- Never commit `.env`, API tokens, service_role keys, registrar passwords, or private keys.
- Profile RLS does not automatically make the existing mock DNS data user-isolated or persistent; that is a separate implementation task.

## License

No license has been declared. All rights reserved by default until the repository owner adds a license.
