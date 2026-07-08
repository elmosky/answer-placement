'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuditForm() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    router.push(`/audit?url=${encodeURIComponent(url.trim())}`)
  }

  return (
    <div className="mx-auto max-w-xl w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourdomain.com"
          aria-label="Your website URL"
          className="flex-1 rounded-full px-5 py-3.5 text-base outline-none border bg-white"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
        />
        <button type="submit" className="btn-primary justify-center">
          Get My Search Visibility Report →
        </button>
      </form>
      <p className="mt-4 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        One-time SEO · AEO · GEO audit · $29
      </p>
    </div>
  )
}
