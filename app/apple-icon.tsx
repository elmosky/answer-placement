import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// iOS ignores favicon.ico, so without this a home-screen shortcut shows a grey
// page screenshot. Draws the same tri-dot mark as LogoMark in
// components/site-header.tsx, scaled from its 22x22 viewBox.
export default function AppleIcon() {
  const k = 180 / 22
  const dot = (cx: number, cy: number, fill: string) => (
    <div
      style={{
        position: 'absolute',
        left: (cx - 4.2) * k,
        top: (cy - 4.2) * k,
        width: 8.4 * k,
        height: 8.4 * k,
        borderRadius: 9999,
        backgroundColor: fill,
      }}
    />
  )

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#ffffff' }}>
        {dot(7, 7, '#f97316')}
        {dot(15, 9, '#a855f7')}
        {dot(9, 15, '#ec4899')}
      </div>
    ),
    size,
  )
}
