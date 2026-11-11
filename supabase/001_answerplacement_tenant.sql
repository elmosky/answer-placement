-- AnswerPlacement joins the Site Factory database (plvuwopoqzgyddadtsvn).
-- Before this it ran on its own project (rotoreichjsdskpprfxw), paused 2026-09-25.
-- Idempotent and additive: creates one new table and one sites row, alters nothing shared.

-- 1. The tenant row. Blog posts in the shared `posts` table point at it by site_id.
--    (factory-launch db would set vercel_project/github_repo to the slug; this
--    project's real names are answer-placement and elmosky/answer-placement.)
insert into public.sites (slug, name, domain, vercel_project, github_repo, status)
values ('answerplacement', 'AnswerPlacement', 'answerplacement.com',
        'answer-placement', 'elmosky/answer-placement', 'live')
on conflict (slug) do update set
  domain = excluded.domain,
  vercel_project = excluded.vercel_project,
  github_repo = excluded.github_repo,
  updated_at = now();

-- 2. Paid audits: one row per completed Stripe Checkout session.
--    Project-prefixed like brewcontent_teardowns. No site_id: only this site writes it.
create table if not exists public.answerplacement_audits (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  url               text not null,
  email             text,
  seo_score         integer,
  aeo_score         integer,
  geo_score         integer,
  report            jsonb not null,
  -- one report per paid session; /api/audit returns the saved one on refresh
  stripe_session_id text unique
);

comment on table public.answerplacement_audits is
  'answerplacement.com paid audits. Shared at /audit/<id>; listed in /admin Data.';

create index if not exists answerplacement_audits_created_at_idx
  on public.answerplacement_audits (created_at desc);

-- Service role only: holds buyer emails. RLS on with no policies blocks anon and
-- authenticated; the explicit grant is needed because tables made through the
-- Management API arrive with none (lesson-supabase-management-api-grants).
alter table public.answerplacement_audits enable row level security;
revoke all on public.answerplacement_audits from anon, authenticated;
grant select, insert, update, delete on public.answerplacement_audits to service_role;
