// Design tokens for the README. These echo zhy0216.github.io: a Manrope (light
// geometric sans) display face, DM Mono for the fine print, and the homepage's
// own ink / paper / electric-blue system — ember orange and Instrument Serif
// are gone. Blocks sit as rounded cards on GitHub's own page background, with
// paper slabs on the light theme and ink slabs on the dark theme, just like
// the homepage alternates paper and ink sections. Every block is rendered
// twice (light + dark) and picked with <picture>.
export type ThemeName = 'light' | 'dark'

export interface Theme {
  name: ThemeName
  /** GitHub's page background this variant sits on (used by the preview only). */
  page: string
  /** Card surface. */
  surface: string
  /** Inset panel inside a card (art panels, the chart). */
  surface2: string
  /** Card border. */
  border: string
  /** Primary text. */
  ink: string
  /** Body copy. */
  body: string
  /** Labels and captions. */
  muted: string
  /** Hairlines inside cards. */
  faint: string
  /** The one accent: ember orange. */
  accent: string
  accentSoft: string
  onAccent: string
  /** Contribution calendar ramp, level 0 → 4. */
  heat: [string, string, string, string, string]
}

export const THEMES: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    page: '#ffffff',
    surface: '#f4f4f0', // --paper
    surface2: '#e8e8e3', // --mist
    border: 'rgba(7,7,7,0.14)', // --line
    ink: '#070707', // --ink
    body: '#565750',
    muted: '#777872', // --muted
    faint: 'rgba(7,7,7,0.1)',
    accent: '#0011e2', // --blue
    accentSoft: 'rgba(0,17,226,0.12)',
    onAccent: '#ffffff',
    heat: ['#e9e9ee', '#cfd4f2', '#97a2f0', '#5568f2', '#0011e2'],
  },
  dark: {
    name: 'dark',
    page: '#0d1117',
    surface: '#070707', // ink section, as on the homepage
    surface2: '#141417',
    border: 'rgba(255,255,255,0.18)', // --line-light
    ink: '#f6f6f2',
    body: '#9a9b95',
    muted: '#83847e',
    faint: 'rgba(246,246,242,0.16)',
    accent: '#5268ff', // --blue-bright
    accentSoft: 'rgba(82,104,255,0.2)',
    onAccent: '#ffffff',
    heat: ['#1e2027', '#313860', '#4a57a8', '#5e70e8', '#8494ff'],
  },
}

export const FONT = {
  // Matches the homepage's --sans (Manrope Variable is weight 200–800).
  sans: "'Manrope Variable','Helvetica Neue','PingFang SC','Microsoft YaHei',Arial,sans-serif",
  mono: "'DM Mono','SF Mono',Menlo,Consolas,monospace",
} as const

/** Logical canvas width shared by every full-width block. */
export const W = 900
/** Width of a 2-up card; two of them plus the 1% gap fill the row. */
export const CARD_W = 445
/** Inner padding of a card. */
export const PAD = 32

export const SITE = 'https://zhy0216.github.io'
export const BLOG = `${SITE}/blog/`
export const GITHUB = 'https://github.com/zhy0216'
export const LINKEDIN = 'https://www.linkedin.com/in/im-yang/'
