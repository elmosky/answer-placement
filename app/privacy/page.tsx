import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — AnswerPlacement',
  description:
    'What AnswerPlacement collects when you run an audit, who processes it, and how to get it deleted.',
  alternates: { canonical: '/privacy' },
}

const UPDATED = 'August 5, 2026'

export default function PrivacyPage() {
  return (
    <div className="mx-auto px-6 py-16" style={{ maxWidth: '44rem' }}>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Last updated {UPDATED}
      </p>

      <div
        className="prose prose-gray max-w-none mt-10"
        style={{ ['--tw-prose-links' as never]: 'var(--color-brand)' }}
      >
        <p>
          This explains what answerplacement.com collects, why, who else touches it, and how to get
          it deleted. We sell one thing, a $29 site audit, and we collect only what running and
          billing that audit needs.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>The website address you submit.</strong> We fetch its public pages to produce
            your report.
          </li>
          <li>
            <strong>Your email address.</strong> From Stripe at checkout, or from you if you enter
            it to have a report sent or saved. It is stored with the audit so we can support you and
            re-send the report.
          </li>
          <li>
            <strong>The report itself.</strong> Scores, findings, and the page content we analyzed
            are stored so your report link keeps working.
          </li>
          <li>
            <strong>Payment records.</strong> Stripe handles the payment and holds the card details.
            We receive a payment reference, the amount, and your email. We never see or store your
            full card number.
          </li>
          <li>
            <strong>Basic analytics.</strong> Google Analytics 4 records visits, pages viewed, rough
            location, device, and referrer, using cookies. We do not run advertising or
            cross-site tracking pixels.
          </li>
        </ul>
        <p>We do not ask for, and have no use for, any sensitive personal data.</p>

        <h2>Why we have it</h2>
        <p>
          To deliver the audit you paid for, to keep your report link working, to take payment and
          handle refunds and disputes, to answer your support emails, and to understand in aggregate
          which pages of our own site work.
        </p>

        <h2>Who processes it</h2>
        <p>These are the services we use. Each one only gets what it needs:</p>
        <ul>
          <li>
            <strong>Stripe</strong> — payments, card details, receipts.
          </li>
          <li>
            <strong>Supabase</strong> — the database that stores audits, report contents, and
            emails.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and server logs for the site.
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> — the AI model that grades the pages we crawled. It
            receives page content from the site being audited, not your personal details.
          </li>
          <li>
            <strong>Page-fetching services (such as Jina and Firecrawl)</strong> — used to retrieve
            the public pages of the site being audited.
          </li>
          <li>
            <strong>Google Analytics</strong> — site analytics.
          </li>
        </ul>
        <p>
          We do not sell your data, and we do not share it with anyone for advertising. We will hand
          over data if the law requires it.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Audits and their reports are kept indefinitely so your report link keeps working, unless
          you ask us to delete them. Payment records are kept as long as tax and accounting rules
          require, which is generally seven years. Analytics data follows Google&rsquo;s standard
          retention.
        </p>

        <h2>Your choices</h2>
        <p>
          Email <a href="mailto:support@answerplacement.com">support@answerplacement.com</a> and we
          will, within 30 days: send you a copy of what we hold about you, correct it, or delete it.
          Deleting an audit also disables its report link. Depending on where you live, you may have
          these rights under the GDPR or the CCPA; we apply them to everyone regardless.
        </p>
        <p>
          To opt out of our analytics, use your browser&rsquo;s tracking protection or the{' '}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics opt-out add-on
          </a>
          .
        </p>

        <h2>Security</h2>
        <p>
          Traffic is served over HTTPS. Report and email records sit in a database that is not
          readable by the public site; only our server-side code can read them. No system is
          perfect, so we keep the amount we store small on purpose.
        </p>

        <h2>Children</h2>
        <p>
          The service is for businesses and is not directed at anyone under 16. We do not knowingly
          collect data from children.
        </p>

        <h2>International transfers</h2>
        <p>
          Our providers are US-based, so if you are outside the United States your data is processed
          there.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes, the &ldquo;last updated&rdquo; date above changes with it. See also
          our <Link href="/terms">Terms of Service</Link>.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions or a deletion request:{' '}
          <a href="mailto:support@answerplacement.com">support@answerplacement.com</a>.
        </p>
      </div>
    </div>
  )
}
