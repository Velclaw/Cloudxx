# Cloudxx

Cloudxx is a domain and DNS management dashboard built with Next.js App Router.

## Stack
- Next.js, React and TypeScript
- Auth.js for credentials, GitHub and Google authentication
- PostgreSQL via Prisma for users, OAuth accounts, verification tokens and profiles
- Resend API for email verification and password reset
- Existing Cloudxx authentication screen and dashboard UI are retained

## Environment
Copy `.env.example` to `.env.local`. Configure `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, GitHub/Google OAuth credentials, `RESEND_API_KEY` and `EMAIL_FROM`. Never commit secrets.

OAuth callbacks: `https://YOUR_HOST/api/auth/callback/github` and `https://YOUR_HOST/api/auth/callback/google`.

## Database
Run `npm run db:generate` and `npm run db:migrate` after configuring PostgreSQL. The code migration does not delete the old Supabase project or its data; export and verify any data that must be retained before disabling that service.

## Development
Run `npm install`, then `npm run dev`. CI runs type checking and the production build.

Credentials accounts require verified email. Passwords are bcrypt-hashed. Verification and reset links use single-use SHA-256 token digests with expiration. OAuth identities and accounts are stored through the Prisma adapter.
