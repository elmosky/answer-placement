# Brief: Being cited first in ChatGPT doesn't win the answer

Status: draft brief, not written, not scheduled. 2026-11-11.
Source idea: Ethan Smith (Graphite) on Lenny's Podcast, "The ultimate guide to AEO", recorded September 2025.
https://www.youtube.com/watch?v=iT7kq-R3Gjc

## Blocker before this can go live

The blog reads posts from Supabase project `rotoreichjsdskpprfxw`, and that host doesn't resolve
(checked 2026-11-11: `host rotoreichjsdskpprfxw.supabase.co` returns NXDOMAIN, Doppler
`answer-placement/dev`). The live /blog shows "No posts yet." Same host that breaks paid audits.
Fix the database first, or this post has nowhere to live.

## Working title

Pick one:

1. Being cited first in ChatGPT doesn't mean you win the answer
2. Why the top link in an AI answer isn't the winner
3. In Google you rank. In ChatGPT you get counted.

## Who it's for

Owners and marketers at small and mid-size businesses who rank fine in Google and assume that
carries over to ChatGPT. They've just searched something like "how do I show up in ChatGPT" or
"why doesn't ChatGPT recommend my business".

## The one idea

Google picks a winner by position. An AI answer picks a winner by how many sources mention you.
The model reads several pages and summarizes them, so the brand that shows up in the most of
those pages gets named first, even if your own page is the top citation.

## Questions the post must answer

These are the follow-ups a reader will have. Each gets a short, direct answer under its own H2.

1. How is an AI answer different from a Google result?
2. If my page is the first citation, why isn't my brand the first recommendation?
3. Where do the other mentions come from? (Reddit, YouTube, review sites, roundup articles, other blogs)
4. Does my Google ranking still matter? (Yes. Smith says everything that works in SEO works here, then there's more on top.)
5. Why can a brand-new business show up quickly? (One Reddit thread or video can get cited next week. Google rankings take years of authority.)
6. Why can't I check this by asking ChatGPT once? (Answers change each run, with wording and by tool. You have to ask many times and count.)
7. What should I do first?

## Outline

- **Opening (under 100 words).** The reader ranks #1 in Google for their main term, asks ChatGPT
  the same question, and a competitor gets named first. Say plainly why.
- **H2: Google ranks pages. AI answers count mentions.** The core mechanic in plain words.
- **H2: Your own page is one vote.** Why the top citation doesn't decide the answer.
- **H2: Where the other votes come from.** The types of sources, with one line each on what earning
  a mention there looks like. Real activity, never fake accounts (see the don'ts).
- **H2: Why new businesses can win here first.** The early-stage angle.
- **H2: You can't check it by asking once.** Answers vary, so measuring means asking many versions
  many times across ChatGPT, Gemini and Perplexity and counting how often you're named.
- **H2: What to do this week.** Three steps: list the 10 questions buyers ask; ask each in two
  tools a few times and note who gets named; look at which sites those answers cite, because
  those are the places to earn a mention.
- **CTA.** The free audit shows how you show up for these questions today. Button: "Get My Search
  Visibility Report".

Length: 1,200 to 1,500 words. One takeaway per H2.

## Evidence we can use

| Claim | Source | How old / how sure |
|---|---|---|
| AI answers summarize many citations, so the most-mentioned brand tends to be named first | Smith, Lenny's Podcast | Sept 2025, his experience, not a published study. Say "in his work" |
| Prompts are about 25 words in chat vs about 6 in Google | Smith, citing Perplexity "or somebody else" | Weak sourcing. Use as "roughly", or leave out |
| ChatGPT's citations overlap with Google's results about 35%; Perplexity about 70% | Graphite study per Smith | Sept 2025. Find the published study before using the numbers |
| Webflow saw about 6x the conversion rate from AI traffic vs Google | Smith | One company, Sept 2025. Label it that way |
| Same question gives different answers per run, per wording, per tool | Smith, plus our own runs | Safe |
| When we asked ChatGPT and Claude for the best AI visibility audit services, both named others (Otterly.AI, HubSpot's AI Search Grader, Semrush, Peec AI, Profound and more) | Our run, research/ai-presence, 2026-10-21 | Ours, 2 answers. Small sample, say so |

Only quote the podcast in short lines with attribution. Link the episode once.

## Our own data (the part nobody else has)

The post is much stronger with one small test we ran ourselves. Suggested: pick 5 buyer questions in
one category, ask each 5 times in ChatGPT and Claude with web search on, and record which brands
get named first and which sites get cited. Then show the gap between "top citation" and "named
first". `research/ai-presence/audit.py` already does most of this.

Cost: the October run was 24 answers for $2.48, so 50 answers is roughly $5 in API fees. Needs
your OK before it runs. Free alternative: ask by hand in the ChatGPT app, about 30 minutes.

## Voice and rules

- Follow BLUEPRINT.md section 8: use "answer", "visibility", "AI answers", "be found, cited,
  recommended". Never "dominate", "hack", "guaranteed".
- Never promise a ranking or a recommendation. Frame it as improving the signals AI tools use.
- Plain words, contractions, no em dashes, no hype.
- Don't tell readers to make fake Reddit accounts or buy reviews. Smith is clear those get
  banned. Recommend real people posting under their own names.

## Done when

- Draft is 1,200 to 1,500 words, answers all 7 questions under their own H2s, and ends on the audit CTA.
- Every number in the table above is either linked to its source with its date or cut.
- 0 em dashes and 0 words from the avoid list (grep the draft).
- The Supabase host resolves and the post shows at https://answerplacement.com/blog with HTTP 200.

## Also found while checking

Claude, asked who runs AnswerPlacement (2026-10-21), told buyers to be careful because the site
names no founder and "Trusted by growing brands" names no brands. That row is still live on the
homepage today. A byline with your name on this post helps with the first part. The logo row
needs real names or removing.
