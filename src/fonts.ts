import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Subset woff2 files (Basic Latin + Latin-1 + a few symbols) generated with
// fontTools from @fontsource-variable/manrope and @fontsource/dm-mono — the two
// faces of zhy0216.github.io. They are inlined as data URIs so the SVG renders
// identically inside GitHub's <img> sandbox, which blocks every external
// request. See fonts/README.md.
const DIR = join(import.meta.dir, '..', 'fonts')

interface Face {
  family: string
  style: 'normal' | 'italic'
  /** CSS font-weight to declare; when null the face covers a variable range. */
  weight: number | null
  /** Lower bound of the variable weight range when `weight` is null. */
  weightMin?: number
  /** Upper bound of the variable weight range when `weight` is null. */
  weightMax?: number
  file: string
}

const FACES: Face[] = [
  { family: 'Manrope Variable', style: 'normal', weight: null, weightMin: 200, weightMax: 800, file: 'manrope-subset.woff2' },
  { family: 'DM Mono', style: 'normal', weight: 400, file: 'dm-mono-subset.woff2' },
  { family: 'DM Mono', style: 'normal', weight: 500, file: 'dm-mono-medium-subset.woff2' },
]

/** Placeholder the build swaps for the @font-face rules once it knows which faces the markup uses. */
export const FONT_SLOT = '/*@fonts*/'

const css = new Map<Face, string>()
const faceCss = (f: Face) => {
  let out = css.get(f)
  if (!out) {
    const b64 = readFileSync(join(DIR, f.file)).toString('base64')
    const weight = f.weight === null ? `font-weight:${f.weightMin} ${f.weightMax}` : `font-weight:${f.weight}`
    out = `@font-face{font-family:'${f.family}';font-style:${f.style};${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`
    css.set(f, out)
  }
  return out
}

/**
 * Replace FONT_SLOT in a rendered SVG with the @font-face rules for the faces
 * its <text> elements actually use, so a block only carries what it needs.
 * A variable face matches any weight within its range; static faces match exactly.
 */
export function inlineFonts(svg: string): string {
  const used = new Set<Face>()
  for (const tag of svg.matchAll(/<text\b[^>]*>/g)) {
    const attrs = tag[0]
    // React escapes the quote around the family name as &#x27;.
    const family = attrs.match(/font-family="(?:'|&#x27;|&#39;)([^'&"]+)/)?.[1]
    const style = attrs.includes('font-style="italic"') ? 'italic' : 'normal'
    const weight = Number(attrs.match(/font-weight="(\d+)"/)?.[1] ?? 400)
    for (const face of FACES) {
      const inWeight = face.weight === null ? weight >= (face.weightMin ?? 0) && weight <= (face.weightMax ?? 0) : weight === face.weight
      if (face.family === family && face.style === style && inWeight) used.add(face)
    }
  }
  return svg.replace(FONT_SLOT, FACES.filter((f) => used.has(f)).map(faceCss).join(''))
}
