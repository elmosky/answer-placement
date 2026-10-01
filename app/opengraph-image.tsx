import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { siteConfig } from '@/site.config'

export const runtime = 'nodejs'
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// The site-wide share card: what Slack, iMessage, X and LinkedIn show when
// someone pastes a link. Colours are the answerplacement theme (themes/index.ts)
// and the channel colours in app/globals.css.
const INK = '#16162a'
const MUTED = '#5b5b6b'
const GRADIENT = 'linear-gradient(100deg, #f97316 0%, #ec4899 45%, #a855f7 100%)'

export default async function OgImage() {
  const inter = await readFile(path.join(process.cwd(), 'assets/og-fonts/inter-600.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(120deg, #ffeede 0%, #ffffff 50%, #efe9ff 100%)',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, color: MUTED }}>{siteConfig.domain}</div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 96, color: INK, letterSpacing: -3 }}>
          {siteConfig.tagline}
        </div>
        <div style={{ display: 'flex', marginTop: 36, width: 220, height: 10, borderRadius: 9999, backgroundImage: GRADIENT }} />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 32, color: MUTED }}>
          SEO, AEO and GEO audits for your site
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Inter', data: inter, weight: 600, style: 'normal' }] },
  )
}
