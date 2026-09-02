import { W, PAD, type Theme } from '../theme'
import { HEADER } from '../content'
import { Root, Card, Sans, Mono, Label, Chips, Pulse, Reveal, Rule, LABEL_TRACK } from '../primitives'
import { textW, wrapW, fmt, f1, f2, monthYear } from '../text'
import type { Data } from '../data'

// Masthead: who / what on the left, a live contribution waveform and four
// counters on the right. The waveform is the README's own "pulse" — built
// from the last 52 weeks of real commits rather than drawn as decoration.
const PANEL = { x: 566, y: 62, w: 302, h: 146 }
const SWEEP = 8 // seconds for the cursor to cross the chart
const INTRO_W = 505

interface Pt {
  x: number
  y: number
}

/** Catmull-Rom through evenly spaced points → cubic Bézier segments. */
function spline(pts: Pt[]) {
  const segs: { p1: Pt; c1: Pt; c2: Pt; p2: Pt }[] = []
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    segs.push({
      p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p2,
    })
  }
  const d = `M${f1(pts[0].x)} ${f1(pts[0].y)}${segs.map((s) => `C${f1(s.c1.x)} ${f1(s.c1.y)} ${f1(s.c2.x)} ${f1(s.c2.y)} ${f1(s.p2.x)} ${f1(s.p2.y)}`).join('')}`
  return { d, segs }
}

const bez = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

export function Header({ data, theme: t }: { data: Data; theme: Theme }) {
  const weeks = data.contributions.weeks
  const weekly = weeks.map((w) => w.days.reduce((sum, d) => sum + d.count, 0))
  const n = weekly.length
  const max = Math.max(1, ...weekly)

  // chart geometry
  const x0 = PANEL.x + 16
  const x1 = PANEL.x + PANEL.w - 16
  const top = PANEL.y + 50
  const bottom = PANEL.y + PANEL.h - 30
  const pts = weekly.map((v, i) => ({ x: x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y: bottom - ((bottom - top) * v) / max }))
  const { d, segs } = spline(pts)
  const area = `${d}L${f1(x1)} ${bottom}L${f1(x0)} ${bottom}Z`
  // The points are evenly spaced, so x is linear in the curve parameter and
  // uniformly sampled y values stay in step with a linearly sweeping cx.
  const SUB = 6
  const ys: number[] = []
  for (const s of segs) for (let k = 0; k < SUB; k += 1) ys.push(f1(Math.min(bottom, bez(s.p1.y, s.c1.y, s.c2.y, s.p2.y, k / SUB))))
  ys.push(f1(pts[n - 1].y))
  const peak = weekly.indexOf(Math.max(...weekly))
  const peakPt = pts[peak]
  const peakLeft = peakPt.x > (x0 + x1) / 2

  const intro = wrapW(HEADER.intro, 'mono', 12, INTRO_W)
  const chipsY = 252 + intro.length * 18 + 2
  const h = Math.max(344, chipsY + 36)
  const statusW = textW(HEADER.status, 'mono', 9.5, LABEL_TRACK)
  const c = data.contributions
  const stats = [
    { value: fmt(data.repos.total), label: 'PUBLIC REPOSITORIES' },
    { value: fmt(data.repos.stars), label: 'STARS EARNED' },
    { value: `${c.longestStreak} days`, label: 'LONGEST STREAK' },
    { value: fmt(data.user.followers), label: 'FOLLOWERS' },
  ]
  const firstDay = weeks[0].days[0].date
  const lastWeek = weeks[n - 1].days
  const lastDay = lastWeek[lastWeek.length - 1].date

  return (
    <Root w={W} h={h} label={`${HEADER.hello} ${HEADER.tagline.join(' ')}`} theme={t}>
      <defs>
        <clipPath id="chart">
          <rect x={x0 - 4} y={top - 14} width={x1 - x0 + 8} height={bottom - top + 15} />
        </clipPath>
        <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={t.accent} stopOpacity="0.3" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <Card w={W} h={h} r={12} />

      {/* status bar */}
      <rect x={PAD} y={31} width={6} height={6} fill={t.accent} />
      <Label x={PAD + 14} y={37}>
        {HEADER.kicker}
      </Label>
      <Pulse x={W - PAD - statusW - 14} y={34} />
      <Label x={W - PAD} y={37} anchor="end" color={t.body}>
        {HEADER.status}
      </Label>
      <Rule x1={PAD} x2={W - PAD} y={52} />

      {/* headline + intro */}
      <Reveal delay={0.05}>
        <Sans x={PAD - 2} y={122} size={58} weight={300} track={-0.022}>
          {HEADER.hello}
        </Sans>
      </Reveal>
      <Reveal delay={0.15}>
        <Sans x={PAD} y={172} size={46} weight={300} track={-0.018}>
          {HEADER.tagline[0]}
        </Sans>
      </Reveal>
      <Reveal delay={0.25}>
        <Sans x={PAD} y={216} size={46} weight={300} track={-0.018} color={t.accent}>
          {HEADER.tagline[1]}
        </Sans>
      </Reveal>
      <Reveal delay={0.35}>
        {intro.map((line, i) => (
          <Mono key={i} x={PAD} y={252 + i * 18} size={12}>
            {line}
          </Mono>
        ))}
      </Reveal>
      <Reveal delay={0.45}>
        <Chips x={PAD} y={chipsY} labels={HEADER.stack} />
      </Reveal>

      {/* contribution waveform */}
      <rect x={PANEL.x + 0.5} y={PANEL.y + 0.5} width={PANEL.w - 1} height={PANEL.h - 1} rx={8} fill={t.surface2} stroke={t.border} />
      <Label x={PANEL.x + 16} y={PANEL.y + 25}>
        {HEADER.chartLabel}
      </Label>
      <Sans x={PANEL.x + PANEL.w - 16} y={PANEL.y + 31} size={26} weight={500} anchor="end">
        {fmt(c.total)}
      </Sans>
      <g clipPath="url(#chart)">
        <line x1={x0} x2={x1} y1={bottom + 0.5} y2={bottom + 0.5} stroke={t.faint} />
        <line x1={x0} x2={x1} y1={f1((top + bottom) / 2) + 0.5} y2={f1((top + bottom) / 2) + 0.5} stroke={t.faint} strokeDasharray="1 3" />
        <path d={area} fill="url(#area)" />
        <path d={d} fill="none" stroke={t.accent} strokeWidth={1.5} strokeLinejoin="round" />
        <line x1={0} x2={0} y1={top - 10} y2={bottom} stroke={t.ink} strokeOpacity={0.35}>
          <animateTransform attributeName="transform" type="translate" from={`${f1(x0)} 0`} to={`${f1(x1)} 0`} dur={`${SWEEP}s`} repeatCount="indefinite" />
        </line>
        <circle cx={f1(x1)} cy={ys[ys.length - 1]} r={3.2} fill={t.accent} stroke={t.surface2} strokeWidth={1.5}>
          <animate attributeName="cx" values={`${f1(x0)};${f1(x1)}`} dur={`${SWEEP}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={ys.join(';')} dur={`${SWEEP}s`} repeatCount="indefinite" />
        </circle>
      </g>
      <circle cx={f1(peakPt.x)} cy={f1(peakPt.y)} r={2.4} fill={t.ink} />
      <Label x={peakLeft ? f1(peakPt.x - 8) : f1(peakPt.x + 8)} y={f1(peakPt.y + 3)} size={8.5} anchor={peakLeft ? 'end' : 'start'} color={t.body}>
        PEAK WEEK · {weekly[peak]}
      </Label>
      <Label x={x0} y={PANEL.y + PANEL.h - 12} size={8.5}>
        {monthYear(firstDay)}
      </Label>
      <Label x={x1} y={PANEL.y + PANEL.h - 12} size={8.5} anchor="end">
        {monthYear(lastDay)}
      </Label>

      {/* counters */}
      <Reveal delay={0.3}>
        {stats.map((s, i) => {
          const x = PANEL.x + 16 + (i % 2) * 150
          const y = PANEL.y + PANEL.h + 22 + Math.floor(i / 2) * 52
          return (
            <g key={s.label}>
              <Sans x={x - 1} y={y + 26} size={30} weight={500} track={-0.015}>
                {s.value}
              </Sans>
              <Label x={x} y={y + 42} size={8.5}>
                {s.label}
              </Label>
            </g>
          )
        })}
      </Reveal>
    </Root>
  )
}
