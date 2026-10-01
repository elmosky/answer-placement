'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Without this file a thrown error shows Next's bare "Application error" page,
// which looks like the whole site is down rather than one page failing.
// Renders inside the root layout, so the header and footer stay.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack once deployed.
    console.error('page error', error.digest, error)
  }, [error])

  return (
    <div className="mx-auto px-6 py-24 text-center" style={{ maxWidth: '36rem' }}>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Something broke on this page</h1>
      <p className="mt-4" style={{ color: 'var(--color-muted-foreground)' }}>
        It&apos;s on our side, not yours. Try again. If it keeps happening, the rest of the site still works.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-3 text-sm font-medium border"
          style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', background: '#fff' }}
        >
          Go to the homepage
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Reference: {error.digest}
        </p>
      )}
    </div>
  )
}
