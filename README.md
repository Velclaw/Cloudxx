# DOMAINS — DNS Sentinel

React + TypeScript + Vite dashboard prototype for DNS zones, records, registrar connections, alerts, audit history, team roles, backups, and API access.

> **Current maturity: UI prototype / local demo.** The application currently uses seeded mock data and browser localStorage. It is not a production DNS control plane. No DNS change is sent to Cloudflare, a registrar, or another provider by the current frontend.

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS 4
- Lucide icons and Motion
- Vercel static deployment; optional GitHub Pages static hosting

## Requirements

- Node.js 22.12+ (Vite 8 requires Node 20.19+ or 22.12+)
- npm

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run build
```

GitHub Actions runs both checks for pull requests and pushes. There is currently no unit-test suite. A successful build does not prove live DNS operations, authentication, RBAC, or notifications work.

## Deploy to Vercel

1. Import `zskbot/DOMAINS` in Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Install command: `npm install`.
6. Deploy a Preview from a feature branch first. Promote to Production only after review.

The repository includes `vercel.json` for the Vite build and SPA fallback. No environment variables are required for the current mock-data UI.

## GitHub Pages

The Pages workflow should build the Vite app and publish only `dist/`. Vercel is the recommended host. Do not run a second Jekyll deployment workflow for this Vite application.

## DNS / Cloudflare integration — implementation boundary

The UI currently contains demo DNS data. A production integration must be implemented server-side (for example, Vercel Functions) and must:

- Store Cloudflare API tokens only in server-side environment variables or a secret manager; never in browser storage or Vite `VITE_*` variables.
- Use narrowly scoped Cloudflare tokens: **Zone / DNS / Read** for read-only access, and grant **Zone / DNS / Edit** only when write operations are explicitly enabled; scope tokens to specific zones.
- Validate zone ownership and record input server-side.
- Require explicit confirmation for destructive changes; preserve before/after snapshots and audit metadata.
- Enforce authenticated server-side RBAC on every API route. UI-only role checks are not authorization.
- Rate-limit and log API operations without logging tokens or secret values.
- Keep registrar credentials encrypted server-side and use provider-specific least-privilege credentials.
- Add integration tests with mocked provider responses before enabling real DNS writes.

Cloudflare permissions reference: https://developers.cloudflare.com/fundamentals/api/reference/permissions/

## Security and data warnings

- The current frontend seeds example domains and records in `src/data/mockDnsData.ts`; those values are illustrative, not proof of domain ownership or live DNS state.
- Browser `localStorage` is not a secure database and must not store API tokens, registrar secrets, 2FA secrets, or backup codes.
- The current 2FA settings and API token screens are demo state, not real authentication or token issuance.
- Replace demo identity, IP, account, and domain values before any public production launch.
- Never commit `.env` files, API tokens, registrar passwords, private keys, or real customer DNS exports.

## Roadmap

1. Replace demo data with server-side persistence and authenticated sessions.
2. Implement Cloudflare zone and DNS-record read operations using server-only credentials.
3. Add explicit-confirmation DNS create/update/delete operations with audit trail and rollback snapshots.
4. Implement real identity, MFA, RBAC, invitations, and session revocation.
5. Implement registrar integrations, notifications, scheduled checks, backups, and restore verification.
6. Add unit, API integration, security, and end-to-end tests.
7. Add monitoring, alerting, retention policy, incident response, and production runbooks.

## License

No license has been declared. All rights reserved by default until the repository owner adds a license.
