import { createContext, useContext, type CSSProperties, type ReactNode, type SVGProps } from 'react'
import { THEMES, FONT, type Theme } from './theme'
import { FONT_SLOT } from './fonts'
import { textW, f2 } from './text'

const ThemeContext = createContext<Theme>(THEMES.light)
export const useTheme = () => useContext(ThemeContext)

const BASE_CSS = 'text{font-kerning:normal}'

interface RootProps {
  w: number
  h: number
  label: string
  theme: Theme
  children: ReactNode
}

/**
 * Root <svg>: transparent background; base CSS plus a slot the build fills with
 * the @font-face rules for the faces the block uses, so the file is self-contained.
 */
export function Root({ w, h, label, theme, children }: RootProps) {
  return (
    <ThemeContext.Provider value={theme}>
      <svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        <title>{label}</title>
        <style dangerouslySetInnerHTML={{ __html: FONT_SLOT + BASE_CSS }} />
        {children}
      </svg>
    </ThemeContext.Provider>
  )
}

interface CardProps {
  x?: number
  y?: number
  w: number
  h: number
  r?: number
  fill?: string
  stroke?: string
}

/** Rounded card surface with a 1px border, snapped to the pixel grid. */
export function Card({ x = 0, y = 0, w, h, r = 10, fill, stroke }: CardProps) {
  const t = useTheme()
  return <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={r} fill={fill ?? t.surface} stroke={stroke ?? t.border} />
}

interface TextProps {
  x: number
  y: number
  size?: number
  color?: string
  anchor?: 'start' | 'middle' | 'end'
  /** letter-spacing in em */
  track?: number
  opacity?: number
  className?: string
  style?: CSSProperties
  rest?: SVGProps<SVGTextElement>
  children: ReactNode
}

export function Sans({ x, y, size = 24, weight = 400, color, anchor = 'start', track = 0, opacity, className, style, rest, children }: TextProps & { weight?: number }) {
  const t = useTheme()
  return (
    <text
      x={x}
      y={y}
      fontFamily={FONT.sans}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={track ? f2(size * track) : undefined}
      fill={color ?? t.ink}
      textAnchor={anchor}
      opacity={opacity}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </text>
  )
}

export function Mono({ x, y, size = 11, weight = 400, color, anchor = 'start', track = 0, opacity, className, style, rest, children }: TextProps & { weight?: 400 | 500 }) {
  const t = useTheme()
  return (
    <text
      x={x}
      y={y}
      fontFamily={FONT.mono}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={track ? f2(size * track) : undefined}
      fill={color ?? t.body}
      textAnchor={anchor}
      opacity={opacity}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </text>
  )
}

export const LABEL_TRACK = 0.08

/** Small tracked mono caption. Pass uppercase text. */
export function Label({ size = 9.5, color, track = LABEL_TRACK, ...props }: TextProps) {
  const t = useTheme()
  return <Mono size={size} track={track} color={color ?? t.muted} {...props} />
}

export const CHIP_H = 20
export const CHIP_TRACK = 0.06
export const chipW = (label: string) => Math.round(textW(label, 'mono', 9, CHIP_TRACK) + 16)

export function Chip({ x, y, label, solid = false }: { x: number; y: number; label: string; solid?: boolean }) {
  const t = useTheme()
  const w = chipW(label)
  return (
    <g>
      <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={CHIP_H - 1} rx={4} fill={solid ? t.accent : 'none'} stroke={solid ? t.accent : t.faint} />
      <Mono x={x + 8} y={y + 13.5} size={9} track={CHIP_TRACK} color={solid ? t.onAccent : t.body}>
        {label}
      </Mono>
    </g>
  )
}

export const chipsW = (labels: string[], gap = 6) => labels.reduce((sum, l) => sum + chipW(l), 0) + gap * Math.max(0, labels.length - 1)

/** A row of chips, laid out from `x` (or ending at `x` when `anchor` is "end"). */
export function Chips({ x, y, labels, gap = 6, anchor = 'start' }: { x: number; y: number; labels: string[]; gap?: number; anchor?: 'start' | 'end' }) {
  let cursor = anchor === 'end' ? x - chipsW(labels, gap) : x
  return (
    <g>
      {labels.map((label) => {
        const el = <Chip key={label} x={cursor} y={y} label={label} />
        cursor += chipW(label) + gap
        return el
      })}
    </g>
  )
}

export function Rule({ x1, x2, y, color, dash }: { x1: number; x2: number; y: number; color?: string; dash?: string }) {
  const t = useTheme()
  return <line x1={x1} y1={y + 0.5} x2={x2} y2={y + 0.5} stroke={color ?? t.faint} strokeDasharray={dash} />
}

interface ArrowProps {
  x: number
  y: number
  size?: number
  diagonal?: boolean
  color?: string
}

/** Arrow glyph (16-unit box, top-left at x/y): ↗ by default, → when `diagonal` is false. */
export function Arrow({ x, y, size = 14, diagonal = true, color }: ArrowProps) {
  const t = useTheme()
  const s = f2(size / 16)
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d={diagonal ? 'M4 12 12 4M5 4h7v7' : 'M2 8h11M9 4l4 4-4 4'}
      fill="none"
      stroke={color ?? t.ink}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** Circled ↗ — the "this whole card is a link" affordance. */
export function LinkMark({ cx, cy, r = 11 }: { cx: number; cy: number; r?: number }) {
  const t = useTheme()
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={t.faint} />
      <Arrow x={cx - 7} y={cy - 7} size={14} color={t.ink} />
    </g>
  )
}

/** Small pulsing "live" dot: solid core plus an expanding, fading ring. */
export function Pulse({ x, y, color, r = 2.5, dur = 2.2 }: { x: number; y: number; color?: string; r?: number; dur?: number }) {
  const t = useTheme()
  const c = color ?? t.accent
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={1}>
        <animate attributeName="r" values={`${r};${r * 3.4}`} dur={`${dur}s`} repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values=".7;0" dur={`${dur}s`} repeatCount="indefinite" />
      </circle>
    </g>
  )
}

/** Blinking text caret. */
export function Caret({ x, y, h, w = 2 }: { x: number; y: number; h: number; w?: number }) {
  const t = useTheme()
  return (
    <rect x={x} y={y} width={w} height={h} fill={t.accent}>
      <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.5;.5;1" dur="1.1s" repeatCount="indefinite" />
    </rect>
  )
}

interface RevealProps {
  delay?: number
  dur?: number
  children: ReactNode
}

/**
 * Staggered fade-up entrance, done with SMIL rather than CSS on purpose: the
 * group's static opacity is 1, so a renderer without animation support shows
 * the content instead of leaving it invisible.
 */
export function Reveal({ delay = 0, dur = 0.9, children }: RevealProps) {
  const total = f2(delay + dur)
  const hold = delay > 0 ? f2(delay / total) : null
  const keyTimes = hold === null ? '0;1' : `0;${hold};1`
  const splines = hold === null ? '.2 .75 .2 1' : '0 0 1 1;.2 .75 .2 1'
  return (
    <g>
      <animate attributeName="opacity" values={hold === null ? '0;1' : '0;0;1'} keyTimes={keyTimes} calcMode="spline" keySplines={splines} dur={`${total}s`} fill="freeze" />
      <animateTransform attributeName="transform" type="translate" values={hold === null ? '0 10;0 0' : '0 10;0 10;0 0'} keyTimes={keyTimes} calcMode="spline" keySplines={splines} dur={`${total}s`} fill="freeze" additive="sum" />
      {children}
    </g>
  )
}

/** Diagonal hatch pattern definition; reference it as `url(#id)`. */
export function Hatch({ id, color, opacity = 0.5, pitch = 6 }: { id: string; color: string; opacity?: number; pitch?: number }) {
  return (
    <pattern id={id} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={pitch / 3} height={pitch} fill={color} fillOpacity={opacity} />
    </pattern>
  )
}
