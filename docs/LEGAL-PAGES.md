# Legal pages: interim, expand with the product

**Status: deliberately provisional. Last reviewed 2026-08-05.**

`/terms` and `/privacy` were written on 2026-08-05 because the site takes payment
(a $29 Stripe checkout) and had neither page — the footer linked to both and each
returned a 404. Shipping *something* accurate beat shipping nothing.

They are **not** a considered legal position. They describe the product as it exists
today: a one-off audit that stores an email address, an audit result, and a Stripe
payment record. Alex's call on 2026-08-05 was that this is fine for now and gets
revised as the product grows. Treat that as the plan, not as an oversight.

## Revisit when any of these happen

- **Accounts or logins ship.** The current text assumes no user accounts, because
  there is no auth anywhere in the codebase. The `/login` link was removed for the
  same reason. Sessions, stored credentials, or OAuth all change the privacy story.
- **Monitoring or subscriptions ship.** The pricing page names ongoing monitoring
  tiers. Recurring billing needs cancellation and renewal terms that a one-off
  purchase does not.
- **Audits start covering third-party sites at scale**, or results get published or
  shared. That raises questions the current text does not answer.
- **Any EU/UK traffic is actively marketed to.** GA4 currently loads unconditionally
  with no consent banner. The privacy policy discloses analytics, but under GDPR
  disclosure is not consent.
- **A legal entity is formed**, or a jurisdiction requires a governing-law clause.

## Specific details that are placeholders, not verified facts

| Item | Current text | Needs |
|---|---|---|
| Contact address | `support@answerplacement.com` | Confirm the mailbox exists and is monitored. It appears on both pages as the data-deletion contact. |
| Refund policy | Full refund if the audit fails or is broken; 14-day no-questions refund | Confirm this is the policy you actually want to honor. It was written to be Stripe-friendly, not from a stated policy. |
| Legal entity + address | Absent | Add if you incorporate, or if Stripe/a jurisdiction requires it. Deliberately omitted rather than invented. |
| Governing law | Absent | Same. |
| Retention | Audits kept until deletion is requested; payment records ~7 years | Confirm this matches intent. |

## Related

- Blog reads will render "No posts yet" until a `posts` table exists in this
  project's Supabase — `public.posts` does not exist today (only `public.audits`).
- This project is **not** connected to GitHub in Vercel, so pushing does not deploy.
  Changes to these pages need a manual `vercel --prod`.
