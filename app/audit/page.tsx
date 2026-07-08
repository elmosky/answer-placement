'use client'

import { useEffect, useState } from 'react'

// Pay-first entry: enter URL → checkout → (result page runs the audit).
export default function AuditPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('url')
    if (q) setUrl(q)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      window.location.href = data.redirectUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto px-6 py-20 text-center" style={{ maxWidth: '40rem' }}>
      <span
        className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full"
        style={{ background: 'var(--color-accent)', color: 'var(--color-geo)' }}
      >
        One-time audit · $29
      </span>
      <h1 className="mt-6 font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
        Analyze your <span className="text-gradient">visibility</span>.
      </h1>
      <p className="mt-4 text-lg" style={{ color: 'var(--color-muted-foreground)' }}>
        A full SEO, AEO &amp; GEO audit of your site — scores plus a prioritized fix list.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          aria-label="Your website URL"
          disabled={loading}
          className="flex-1 rounded-full px-5 py-3.5 text-base outline-none border bg-white"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        />
        <button type="submit" disabled={loading} className="btn-primary justify-center">
          {loading ? 'One moment…' : 'Get my audit — $29 →'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm" style={{ color: '#dc2626' }}>{error}</p>}

      <p className="mt-6 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        One-time payment · Your report is delivered in ~90 seconds.
      </p>
    </div>
  )
}
