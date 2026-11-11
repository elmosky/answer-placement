# Answer Placement — Build Blueprint

> **Status (2026-11-11):** live, one-time $29 paid audit. Runs as a tenant of the shared
> Site Factory database (`plvuwopoqzgyddadtsvn`): blog in factory `posts`, audits in
> `answerplacement_audits`, `/admin` is factory-admin. §1 tiers, §4 data model and §6 pricing
> below are the original plan and partly obsolete; README.md describes what is built.

> Domain: **answerplacement.com**
> Tagline: **Become the answer. Not just another result.**
> Hero: **Be found. Be cited. Be recommended.**
> Category: AI search visibility audit across three channels — **SEO (be found) · AEO (be cited) · GEO (be recommended)**.

## Decisions locked (2026-06-26)
- **The 3-channel framework is the product.** Every audit returns three scores — SEO, AEO, GEO — each 0–100, color-coded orange / blue / purple. This is the organizing metaphor for the whole site, the rubric, and the report.
- **Model = productized service, not a cheap SaaS report.** Free instant audit is the lead magnet; revenue comes from human-delivered (AI-assisted) audit tiers + a monitoring subscription. Pricing in §6.
- **Scope:** SEO + AEO + GEO (all three), per the framework.
- **Voice:** smart growth consultant explaining a search shift — clear, modern, commercially sharp. Never "AI bro," never jargon, never guarantee rankings. Word lists in §8.

---

## 1. The funnel & the model

The **free instant audit is the acquisition lever.** Visitor pastes a URL → automated engine returns the three scores + top issues → email capture → upsell into a paid, human-delivered audit. The homepage exists to drive one action: *get my report*.

```
Homepage URL field  ("Get My Search Visibility Report" — no credit card)
   → FREE instant audit: homepage + few pages, 3 scores + top issues
   → email capture, show teaser report
   → Upsell to PAID tiers ($499 / $1,500 / $3,500) — delivered in 48hr–5 days
   → Post-audit: monthly Monitoring subscription ($750–2,000/mo)
```

Key distinction from a pure-SaaS build: **paid tiers are fulfilled, not instantly unlocked.** Checkout creates an *order* + intake; the engine generates the deep report, a human reviews/packages it (and runs the call on higher tiers), then it's delivered. The 48hr–5-day SLAs give room for that QA. The same engine powers every tier — humans add value (competitor analysis, roadmap, strategy call) as price climbs.

---

## 2. The audit engine — three channel scores (the IP)

Each channel scored 0–100 from its own rubric. Free tier runs a light version; paid tiers run the deep version with more pages + human synthesis.

### SEO — Be found
Keyword & intent alignment · technical SEO health · on-page optimization · internal linking · metadata & titles · category/product page quality · content depth · backlink & authority signals.

### AEO — Be cited
Answer-focused content · FAQ coverage · structured data & schema · clear definitions · comparison content · question-based formatting · snippet-friendly paragraphs · sourceworthiness & clarity.

### GEO — Be recommended
Brand clarity · entity signals · product & use-case positioning · "best for" language · comparison pages · review/proof signals · third-party mentions · trust indicators · category authority · competitor context.

**Per-finding output:** severity · what's wrong · why it hurts visibility · the fix. Rolled into a **prioritized fix list** (this is the deliverable people pay for — diagnosis + roadmap).

### Tech
- **Crawl:** Firecrawl (`map` + `scrape`) — keys in Doppler `qwen-writer/dev`. Page count capped per tier (§6). ⚠️ Credit-heavy; free tier stays tiny.
- **Grade:** Claude (Anthropic API) — Sonnet per-page, Opus for site-level synthesis. Structured JSON against each channel rubric.
- **AI-answer checks (AEO/GEO):** probe whether the brand actually surfaces in AI answers for category queries (where feasible) — feeds the GEO score.
- **Async job:** v1 audit is near-instant; deeper tiers run as background jobs → human review → delivery.

### Build order — v1 / v2 / v3
The engine ships in three fidelities. Each is usable on its own and maps to a tier.

**v1 — Site-side engine (build first). Deps: Firecrawl + Anthropic (both already in hand).**
- Firecrawl `map` + `scrape` homepage + top ~5 pages.
- Parse: headings, meta, JSON-LD schema, robots.txt / llms.txt, sitemap, AI-crawler directives (GPTBot / ClaudeBot / Google-Extended), render-without-JS check, status codes.
- Claude grades all three rubrics → SEO / AEO / GEO scores + top issues + fix list.
- GEO here = *readiness* inferred from the site (entity clarity, comparison / "best for" pages, on-site trust/review signals) — **no live LLM probing yet**.
- Powers the **Snapshot ($499)** tier and the lead-capture scorecard. No new vendors → fastest path to a real, sellable product.

**v2 — Answer-engine probing (the real GEO/AEO differentiator). Deps: OpenAI + Gemini keys, SERP API; Perplexity optional.**
- Prompt panel: Claude generates 15–50 category buyer prompts → run against ChatGPT, Gemini, Claude (web-search/grounding on) → parse each answer for brand mention, prominence, sentiment, cited sources, competitors.
- Compute **Share of Voice** vs competitors → real GEO score. Run each prompt 2–3× and average (non-determinism).
- AI Overview presence + rankings via SERP API (DataForSEO / SerpAPI) → real AEO/SEO signal.
- Durable job runner (Inngest / Trigger.dev) — hundreds of calls per audit. Competitor benchmarking.
- Powers **Growth ($1,500)**.

**v3 — Authority + monitoring + scale. Deps: backlink API (DataForSEO / Ahrefs).**
- Backlinks / domain authority, deep ranking + category analysis, "best for" positioning strategy, 90-day roadmap generation.
- **Monitoring subscription:** scheduled re-runs, trend charts, alerts. Powers **Authority** + **Monitoring ($750–2,000/mo)**.

**Perplexity:** not needed for v1 (no live probing). In v2 it's *optional* — ChatGPT + Gemini + Claude already cover the majority of answer-engine audience; Perplexity's Sonar API is a low-effort bonus (native citations) but not required. Add it if easy, skip it if not.

---

## 3. Tech stack (house standard)

- **Framework:** Next.js 16 (App Router) + React 19 — fork `~/projects/site-template`
- **Styling:** Tailwind v4 with the design tokens in §7
- **DB/Auth:** Supabase
- **Payments:** Stripe Checkout (one-time for audit tiers, subscription for monitoring)
- **Email:** transactional ("report ready") + lead nurture (Resend or Supabase)
- **Crawl:** Firecrawl · **LLM:** Anthropic API
- **PDF:** report export for paid tiers
- **Deploy:** Vercel (CLI, consistent with willmybagfuckingfit)

---

## 4. Data model (Supabase)

> Built (2026-11-11): only `answerplacement_audits` (id, url, email, seo/aeo/geo_score, report, stripe_session_id, created_at) in the factory DB. The tables below were the plan.

```
audits            (free instant scans = leads)
  id, url, email, seo_score, aeo_score, geo_score,
  report_json, pages_crawled, created_at, source

orders            (paid tiers, Stripe)
  id, audit_id, email, tier (snapshot|growth|authority),
  amount, stripe_session_id, status (paid|in_progress|delivered),
  intake_json, report_url, delivered_at, created_at

subscriptions     (monitoring)
  id, customer_email, stripe_sub_id, status, started_at

leads             (email capture, dedupe by email)
  id, email, url, created_at, source
```
Findings live in `report_json`. Paid fulfillment tracked via `orders.status`.

---

## 5. Pages

| Route | Purpose |
|---|---|
| `/` | The funnel — hero URL field, 3 cards, pricing, CTAs |
| `/audit/[id]` | Free teaser report — 3 scores + top issues + upsell |
| `/how-it-works` | Methodology + trust in the score |
| `/sample-report` | Public sample (key conversion asset — referenced in nav) |
| `/pricing` | Snapshot / Growth / Authority + monitoring |
| `/checkout/success` · `/checkout/cancel` | Stripe returns + intake form |
| `/resources` | (nav dropdown) — blog/guides, AEO/GEO education (SEO play) |
| `/privacy` · `/terms` | Legal (crawling third-party sites + payments) |

---

## 6. Pricing & monetization (locked)

**Public tiers — start productized, not cheap.** A $99 audit reads as an automated checklist; these read as strategic reports for a new search landscape.

| Tier | Price | Pages | Delivery | Includes |
|---|---|---|---|---|
| **Free instant** | $0, no CC | homepage + 1–2 | instant | 3 scores + top issues (lead magnet) |
| **Snapshot** | **$499** | homepage + top 5 | 72 hrs | 3-channel scorecard, top 10 issues, priority fix list, PDF |
| **Growth** ⭐ core | **$1,500** | up to 25 | 5 days | + competitor comparison, AI Overview opportunity, content gaps, schema recs, prioritized roadmap, exec summary, 30-min call |
| **Authority** | **from $3,500** (custom) | up to 75 | custom | + deep competitor/category, "best for" positioning, comparison strategy, FAQ architecture, trust review, 90-day roadmap, 60-min strategy call, implementation handoff |
| **Monitoring** add-on | **$750–2,000/mo** | recurring | monthly | Monthly SEO/AEO/GEO check, new opportunities, competitor movement, updated fix list, report |

**Sequencing:** lead with the audit, not the subscription. Monitoring is sold *after* the customer has seen the gap. Public page shows Snapshot + Growth + "Authority — custom"; monitoring introduced post-delivery.

**Why it works:** Growth is the core offer — one good comparison page or AI-visibility fix justifies $1,500, and it's within founder/marketing-lead approval range. Authority bridges into retainers/implementation. Margins are strong: engine cost per deep audit is ~$1–4 (Firecrawl + LLM) against $499–3,500 price — the spend is human review time, not infra.

---

## 7. Design system (from inspiration mockup)

**Feel:** light, airy, modern, lots of whitespace. Soft peach→lavender gradient background. Clean geometric sans. Friendly but commercially sharp — not techy, not playful-cartoon.

**Color tokens:**
```
--bg-gradient: peach/cream (top-left) → lavender/white
--ink:        near-black slate (#15151f-ish) for headlines/body
--seo:        orange   (~#F97316)
--aeo:        blue     (~#3B82F6)
--geo:        purple   (~#A855F7)
--accent-gradient: orange → pink → purple   (logo dots, "recommended", emphasis)
--btn:        near-black (#111) pill, white text
--card:       white, rounded-2xl, soft shadow, hairline border
--pill/badge: light lavender bg, uppercase, letter-spaced, small
```

**Logo:** lowercase `answerplacement` (bold) + `.com` (lighter), preceded by a tri-dot cluster in the orange/pink/purple gradient (the three channels).

**Type:** geometric sans for display (recommend **General Sans** or **Satoshi** — free, match the rounded-geometric look), Inter for body. *Confirm before build.*

**Components:** rounded pill buttons, soft-shadow white cards, channel cards with a product visual (Google result / AI Overview / ChatGPT mock) + checklist + score + sparkline, logo trust row, gradient emphasis on one word per headline.

---

## 8. Voice & copy

**Locked hero:**
> **Be found. Be cited. Be recommended.**
> Search has evolved. We analyze your site across SEO, AEO, and GEO so you show up in search results, AI answers, and AI recommendations.
> CTA: **Get My Search Visibility Report** · secondary: **See Sample Report**
> Trust row: AI-Powered Analysis · Actionable Fixes · Within 48 Hours

**Homepage section order:**
1. Hero (badge "THE 3-CHANNEL SEARCH AUDIT" + H1 + sub + CTA + trust row)
2. Three channel cards — SEO / AEO / GEO (visual + checklist + score)
3. "Trusted by growing brands" logo row
4. **One audit. Three visibility layers. Infinite opportunities.** + 4 features: Clear Scores · Actionable Roadmap · Win More Visibility · Fast Turnaround
5. **What the audit flags** (thin category pages, weak schema, missing comparison content, buried proof, unclear positioning, no answer-ready FAQs, weak internal linking, missing "best for" use cases, poor entity clarity, inconsistent trust signals)
6. **What you get** (3-channel scorecard, priority fix list, AI visibility report, content opportunity map, schema/structure recs, competitor notes, exec summary, optional call)
7. Pricing
8. CTA band — "Join 1,200+ brands getting found, cited, and recommended" + No credit card required
9. FAQ + footer

**Channel card copy (locked):**
- **SEO · Be found** — Show up in Google results. Rank your key pages for the terms your customers are searching for.
- **AEO · Be cited** — Get into AI answers. See whether your content is clear, structured, and useful enough for AI Overviews and answer engines to cite.
- **GEO · Be recommended** — Earn AI recommendations. Understand whether AI tools can identify your brand, trust your positioning, and recommend you for the right use cases.

**Alt taglines:** "See what AI sees when it looks at your brand." · "Your customers are asking AI what to buy. Make sure you're in the answer." · "Page one is no longer the finish line." · "Don't just rank. Get chosen."

**Words to use:** answer · recommendation · visibility · search · AI answers · AI Overviews · roadmap · scorecard · fix list · trust signals · brand clarity · category authority · be found/cited/recommended.

**Words to avoid:** revolutionary · disruptive · proprietary AI magic · dominate · hack · growth hack · LLM optimization stack · guaranteed ranking · guaranteed AI recommendation.

**Never:** promise guaranteed rankings or AI recommendations. Frame as "we improve the signals AI uses to understand, cite, and recommend you."

---

## 9. Unit economics

| | Pages | Firecrawl | LLM | Engine cost |
|---|---|---|---|---|
| Free instant | homepage + 1–2 | ~3–5 cr | 1 pass | **pennies** (lead magnet) |
| Snapshot $499 | + top 5 | ~6–8 cr | ~5 passes | **~$1–2** |
| Growth $1,500 | up to 25 | ~25–35 cr | per-page | **~$2–4** |
| Authority $3,500 | up to 75 | ~75 cr | per-page | **~$4–8** |

Rules: keep the **free tier tiny + cached + rate-limited per URL/IP/day** so nobody drains Firecrawl credits. Engine cost is trivial vs price — the real cost is human review time on paid tiers, so automate report generation as much as possible and reserve human effort for synthesis/calls.

---

## 10. Build phases

1. **Scaffold** — fork site-template, design tokens (§7), Supabase + env, deploy blank shell to Vercel → live URL
2. **Homepage** — full funnel with locked copy (§8) + 3-channel cards + pricing + URL submit
3. **Free engine** — Firecrawl scrape + LLM grading → 3 scores + top issues → email capture → `/audit/[id]` teaser
4. **Checkout** — Stripe for Snapshot/Growth + intake form on success; order record
5. **Deep audit + fulfillment** — background job (25/75 pages) → report generation → admin review → PDF delivery
6. **Sample report + supporting pages** — /sample-report, /how-it-works, /pricing, legal
7. **Monitoring subscription** — post-audit upsell, scheduled re-crawls
8. **Polish + launch** — OG/score share image, analytics, Resources/blog (SEO play on our own medicine)

Phases 1–3 = demoable MVP (free 3-score audit live). 4–5 turn on revenue.

## 11. Confirms (locked 2026-06-26)
- **Display font:** Satoshi (body: Inter).
- **Free-tier crawl:** up to ~5 key pages, cached + rate-limited per URL/IP/day. Paid tiers crawl to their tier cap (5/25/75).
- **Snapshot fulfillment:** human QA before delivery (held to 72hr SLA), not auto-instant.
- **Resources + blog:** included at launch (also our own SEO/AEO/GEO proof).
