import type { ThemeName, ThemeTokens } from '@/lib/types'

/**
 * Theme presets — each is a complete, tuned design system.
 * Pick one in site.config.ts. Override individual tokens as needed.
 */

const minimal: ThemeTokens = {
  colors: {
    brand: '#10b981',
    brandHover: '#059669',
    background: '#ffffff',
    foreground: '#111827',
    muted: '#f9fafb',
    mutedForeground: '#6b7280',
    border: '#e5e7eb',
    accent: '#f3f4f6',
  },
  fonts: {
    sans: 'Geist, ui-sans-serif, system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: 'ui-monospace, monospace',
    heading: 'Geist, ui-sans-serif, sans-serif',
    body: 'Geist, ui-sans-serif, sans-serif',
  },
  radius: { sm: '0.375rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
  spacing: { container: '64rem', section: '4rem' },
  layout: { homepage: 'hero-rates', blogIndex: 'grid', postLayout: 'centered' },
}

const magazine: ThemeTokens = {
  colors: {
    brand: '#dc2626',
    brandHover: '#b91c1c',
    background: '#ffffff',
    foreground: '#0a0a0a',
    muted: '#fafafa',
    mutedForeground: '#525252',
    border: '#e5e5e5',
    accent: '#fef2f2',
  },
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    serif: '"Playfair Display", Georgia, serif',
    mono: 'ui-monospace, monospace',
    heading: '"Playfair Display", Georgia, serif',
    body: 'Inter, ui-sans-serif, sans-serif',
  },
  radius: { sm: '0', md: '0', lg: '0', full: '9999px' },
  spacing: { container: '72rem', section: '5rem' },
  layout: { homepage: 'magazine-grid', blogIndex: 'magazine', postLayout: 'wide' },
}

const modern: ThemeTokens = {
  colors: {
    brand: '#8b5cf6',
    brandHover: '#7c3aed',
    background: '#0a0a0a',
    foreground: '#fafafa',
    muted: '#171717',
    mutedForeground: '#a3a3a3',
    border: '#262626',
    accent: '#1f1f1f',
  },
  fonts: {
    sans: 'Geist, ui-sans-serif, system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: '"Geist Mono", ui-monospace, monospace',
    heading: 'Geist, ui-sans-serif, sans-serif',
    body: 'Geist, ui-sans-serif, sans-serif',
  },
  radius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', full: '9999px' },
  spacing: { container: '68rem', section: '6rem' },
  layout: { homepage: 'editorial-feature', blogIndex: 'list', postLayout: 'centered' },
}

const editorial: ThemeTokens = {
  colors: {
    brand: '#1e40af',
    brandHover: '#1e3a8a',
    background: '#fefdf8',
    foreground: '#1c1917',
    muted: '#f5f4ed',
    mutedForeground: '#57534e',
    border: '#e7e5e0',
    accent: '#fef3c7',
  },
  fonts: {
    sans: 'Inter, ui-sans-serif, sans-serif',
    serif: '"Source Serif Pro", Georgia, serif',
    mono: 'ui-monospace, monospace',
    heading: '"Source Serif Pro", Georgia, serif',
    body: '"Source Serif Pro", Georgia, serif',
  },
  radius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', full: '9999px' },
  spacing: { container: '60rem', section: '5rem' },
  layout: { homepage: 'minimal-list', blogIndex: 'list', postLayout: 'centered' },
}

// AnswerPlacement — light, airy, modern. Peach→lavender gradient lives in globals.css;
// channel colors (SEO/AEO/GEO orange/blue/purple) are brand-specific CSS vars also in globals.css.
const answerplacement: ThemeTokens = {
  colors: {
    brand: '#16162a',          // ink — logo + primary pill buttons
    brandHover: '#000000',
    background: '#ffffff',     // base; body gradient overrides in globals.css
    foreground: '#16162a',
    muted: '#f7f7fb',
    mutedForeground: '#5b5b6b',
    border: '#ececf2',
    accent: '#f3f0ff',         // light lavender — badges/pills
  },
  fonts: {
    sans: '"Satoshi", ui-sans-serif, system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: 'ui-monospace, monospace',
    heading: '"Satoshi", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  radius: { sm: '0.5rem', md: '0.875rem', lg: '1.25rem', full: '9999px' },
  spacing: { container: '72rem', section: '5.5rem' },
  layout: { homepage: 'hero-rates', blogIndex: 'grid', postLayout: 'centered' },
}

export const themes: Record<ThemeName, ThemeTokens> = {
  minimal,
  magazine,
  modern,
  editorial,
  answerplacement,
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] }

export function resolveTheme(name: ThemeName, overrides?: DeepPartial<ThemeTokens>): ThemeTokens {
  const base = themes[name]
  if (!overrides) return base
  return {
    colors: { ...base.colors, ...(overrides.colors ?? {}) },
    fonts: { ...base.fonts, ...(overrides.fonts ?? {}) },
    radius: { ...base.radius, ...(overrides.radius ?? {}) },
    spacing: { ...base.spacing, ...(overrides.spacing ?? {}) },
    layout: { ...base.layout, ...(overrides.layout ?? {}) },
  }
}

export function themeToCssVars(theme: ThemeTokens): Record<string, string> {
  return {
    '--color-brand': theme.colors.brand,
    '--color-brand-hover': theme.colors.brandHover,
    '--color-background': theme.colors.background,
    '--color-foreground': theme.colors.foreground,
    '--color-muted': theme.colors.muted,
    '--color-muted-foreground': theme.colors.mutedForeground,
    '--color-border': theme.colors.border,
    '--color-accent': theme.colors.accent,
    '--font-sans': theme.fonts.sans,
    '--font-serif': theme.fonts.serif,
    '--font-mono': theme.fonts.mono,
    '--font-heading': theme.fonts.heading,
    '--font-body': theme.fonts.body,
    '--radius-sm': theme.radius.sm,
    '--radius-md': theme.radius.md,
    '--radius-lg': theme.radius.lg,
    '--radius-full': theme.radius.full,
    '--container': theme.spacing.container,
    '--section': theme.spacing.section,
  }
}
