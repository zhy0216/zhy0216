import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// SVG text does not wrap or measure itself, so layout is computed from the
// fonts' own advance widths (fonts/metrics.json, generated alongside the
// subsets). Kerning is ignored, which errs a hair wide — fine for layout.
export type Face = 'sans' | 'mono' | 'monoMedium'

type Metrics = Record<Face, { unitsPerEm: number; advances: Record<string, number> }>
const METRICS = JSON.parse(readFileSync(join(import.meta.dir, '..', 'fonts', 'metrics.json'), 'utf8')) as Metrics
const FALLBACK: Record<Face, number> = { sans: 0.53, mono: 0.6, monoMedium: 0.6 }

export const f1 = (n: number) => Math.round(n * 10) / 10
export const f2 = (n: number) => Math.round(n * 100) / 100

/**
 * Rendered width of `text` in `face` at `size` px with `track` em letter-spacing.
 * Renderers without subpixel positioning (Chromium on Linux, for one) round
 * every glyph advance to whole pixels, so each advance is taken as the larger
 * of the exact and the rounded value — layouts get a little slack elsewhere
 * rather than overflowing there.
 */
export function textW(text: string, face: Face, size: number, track = 0): number {
  const adv = METRICS[face].advances
  let w = 0
  for (const ch of text) {
    const exact = (adv[ch] ?? FALLBACK[face]) * size
    w += Math.max(exact, Math.round(exact)) + track * size
  }
  return f2(w)
}

/** Greedy word wrap by measured width. */
export function wrapW(text: string, face: Face, size: number, maxW: number, track = 0): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (textW(next, face, size, track) > maxW && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Truncate one line to `maxW`, ending with an ellipsis. */
export function clampW(text: string, face: Face, size: number, maxW: number, track = 0): string {
  if (textW(text, face, size, track) <= maxW) return text
  let out = text
  while (out.length > 1 && textW(`${out}…`, face, size, track) > maxW) out = out.slice(0, -1)
  return `${out.replace(/[\s,.;:—–-]+$/, '')}…`
}

/** Keep at most `max` lines, ending the last kept line with an ellipsis. */
export function clampLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  kept[max - 1] = `${kept[max - 1].replace(/[\s,.;:—–-]+$/, '')}…`
  return kept
}

export const fmt = (n: number) => n.toLocaleString('en-US')
export const pad2 = (n: number) => String(n).padStart(2, '0')

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** "2026-08-25" → "AUG 25, 2026" (no timezone surprises: parse the parts). */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}
/** "2026-08-25" → "AUG 25". */
export function dayLabel(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}
export function monthShort(iso: string): string {
  return MONTHS[Number(iso.slice(5, 7)) - 1]
}
/** "2026-08-25" → "AUG '26". */
export function monthYear(iso: string): string {
  return `${monthShort(iso)} '${iso.slice(2, 4)}`
}
