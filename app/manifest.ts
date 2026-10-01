import type { MetadataRoute } from 'next'
import { siteConfig } from '@/site.config'

// Served at /manifest.webmanifest. Supplies the name and colours when someone
// saves the site to a phone home screen. Colours match the answerplacement theme
// in themes/index.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16162a',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
