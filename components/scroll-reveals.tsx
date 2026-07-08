'use client'

import { useEffect } from 'react'

// Scroll-open reveals: any element marked `data-reveal` fades + slides up as it
// enters the viewport. Native IntersectionObserver (same technique as the
// AllergyTable homepage). Progressive enhancement: the opacity:0 start only
// applies once JS marks the page ready, so content is never hidden without JS.
const CSS = `.reveals-ready [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);transition-delay:var(--d,0s);will-change:opacity,transform}
.reveals-ready [data-reveal].in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.reveals-ready [data-reveal]{opacity:1;transform:none;transition:none}}`

export function ScrollReveals() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('reveals-ready')
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}
