# K-UNIV KPI Dashboard

Internal KPI dashboard for K-UNIV. Password-protected, responsive, built with
Next.js (App Router) + TypeScript + Tailwind + Recharts.

**Current status:** UI is complete. Google Sheets (content log) is fully
wired in code and will use real data as soon as `.env.local` has valid
credentials — until then it falls back to mock data automatically. GA4 and
K-UNIV member data are still mock-only. See "Connecting real data" below.
This mirrors the plan in `REQUIREMENTS.md`, `DATA_SOURCE_MAP.md`,
`SECURITY_CHECKLIST.md`, `IMPLEMENTATION_PLAN.md` from the survey phase
(kept one level up, in the parent folder).

## Getting started

```bash
npm install
cp .env.example .env.local
npm run hash-password -- "yourStrongPassword"   # paste the output into DASHBOARD_PASSWORD_HASH
# generate SESSION_SECRET, e.g.: openssl rand -hex 32
npm run dev
```

Open http://localhost:3000 — you'll land on the login page. Log in with the
password you hashed above.

## Project structure

- `app/login` — login page (password form)
- `app/dashboard` — the KPI dashboard (protected by `middleware.ts`)
- `app/api/auth/*` — login/logout routes, server-side session cookie
- `lib/auth.ts` — password hashing + signed session token (no external auth lib)
- `lib/types.ts` — shared KPI data shapes
- `lib/mockData.ts` — placeholder data (shaped like the real K-UNIV admin numbers)
- `lib/data/kuniv.ts` — 사용자 (member) data — **not wired to a live source yet**
- `lib/data/ga4.ts` — GA4 traffic / signup-source / conversion — **not wired yet**
- `lib/data/sheets.ts` — Google Sheets content log — **wired**, reads the
  confirmed `[K-UNIV]성과` tab via `googleapis`; falls back to mock data if
  `GOOGLE_SHEETS_SPREADSHEET_ID` / service account env vars aren't set
- `lib/aggregate.ts` — pure functions that turn raw content rows into the
  summaries/charts the UI needs (null-safe, per the D+7 / null-vs-zero rules)
- `components/dashboard/*` — one component per dashboard section

## Connecting real data (next steps)

Each file in `lib/data/` has a `STATUS` comment explaining exactly what's
missing and what to do once it's available. Short version:

1. **사용자 (members)** — confirm whether K-UNIV has a read-only API
   (preferred) or an admin CSV export (fallback) for member counts. Manual
   browser-based pulls (as done during the survey phase) are fine for a
   one-off number, but should not be automated into this app with stored
   admin credentials — see `SECURITY_CHECKLIST.md` section 3b.
2. **Google Sheets (content log)** — done in code. You just need to:
   a. Create a Google Cloud service account, enable the Sheets API for it.
   b. Share the spreadsheet with the service account's email as **Viewer**.
      Note: this spreadsheet also has an "SNS accounts" tab with plaintext
      social passwords — sharing the file gives the service account access
      to that tab too (Sheets permissions are per-file). Accepted as a
      known risk on 2026-07-26 — see `SECURITY_CHECKLIST.md` 3c.
   c. Put the service account email + private key into `.env.local`
      (`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`).
      `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_SHEETS_CONTENT_TAB` are
      already filled in in `.env.example`.
   d. Restart the dev server — `콘텐츠 성과` / `BEST 콘텐츠` / etc. should
      switch from mock to real numbers automatically.
3. **GA4** — grant a service account Viewer access on the GA4 property, add
   `GA4_PROPERTY_ID`, then implement `getSignupSourceBreakdown` and
   `getConversionStats` in `lib/data/ga4.ts` using `@google-analytics/data`.

Until then, every section shows a small "Mock data" badge or is visibly
built from `lib/mockData.ts` so nobody mistakes placeholder numbers for real
ones.

## Security notes

- No secrets are hard-coded anywhere; everything comes from environment
  variables (see `.env.example`).
- The session cookie is `httpOnly`, `sameSite=strict`, and signed with
  `SESSION_SECRET` (HMAC-SHA256) — nothing is stored in `localStorage`.
- All planned external data connections are read-only.
- No member PII (name/email/phone) is fetched, stored, or displayed —
  dashboard only shows aggregate counts.

## Deployment

Not deployed yet. When ready, this is a standard Next.js app and deploys
cleanly to Vercel — just set the same environment variables there. Per the
project's safety rules, don't deploy to production without explicit
confirmation.
