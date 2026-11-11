# AnswerPlacement

[answerplacement.com](https://answerplacement.com): a one-time paid AI-search visibility audit.
A buyer pays $29 through Stripe Checkout, the engine (`lib/audit/`) scores their site on
SEO, AEO and GEO, and the report is saved and shareable at `/audit/<id>`.

## Data: the shared Site Factory database

Since 2026-11-11 the site is a tenant of the factory Supabase project (`plvuwopoqzgyddadtsvn`),
like Brew Content and LocalTrophy. Its old project (`rotoreichjsdskpprfxw`) is paused, not deleted.

| What | Where |
|---|---|
| Blog posts | factory `posts`, site slug `answerplacement`, written at `/admin` |
| Paid audits | `answerplacement_audits` (service role only; schema in `supabase/001_answerplacement_tenant.sql`) |
| Admin | `/admin` = `@elmosky/factory-admin`: magic-link sign-in, Blog, Data (Audits), Traffic |

All database access goes through `lib/db.ts` (`@elmosky/factory-db`, project ref pinned).
Local dev reads and writes **production**: there is no dev database.

Factory packages live in `vendor/@elmosky/` and are edited only in `~/projects/factory-packages`;
update them with `factory-launch sync answerplacement --apply`. The build fails if the copy here is edited.

## Secrets

Doppler project `answer-placement`, config `dev` (`doppler.yaml`). Shared factory values
(Supabase, admin allowlist, Google OAuth, image agent) are Doppler references to
`affiliate-sites/prd`, so a rotation there reaches this site too. Vercel production and preview
hold their own copies. Variable names are in `.env.example`.

```bash
doppler run -- npm run dev
```

## Deploy

Push to `main`; Vercel project `answer-placement` builds it. A Vercel env change needs a redeploy.
