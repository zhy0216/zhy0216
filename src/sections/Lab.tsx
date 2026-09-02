import { W, PAD, type Theme } from '../theme'
import { Root, Card, Sans, Mono, Label, LinkMark, Reveal, Rule, LABEL_TRACK } from '../primitives'
import { fmt, dayLabel, monthShort, textW, f1, f2 } from '../text'
import type { Data, Level } from '../data'

// The GitHub-native block: the contribution calendar, restyled, with the
// language split and activity facts under it.
export const LAB_H = 384
const GX = 74
const GY = 78
const CELL = 11
const PITCH = 14
const WEEKDAYS: Record<number, string> = { 1: 'MON', 3: 'WED', 5: 'FRI' }
const COLS = { a: PAD, b: 352, c: 632 }
const ROW_Y = 254
const ROW_H = 17

export function Lab({ data, theme: t }: { data: Data; theme: Theme }) {
  const weeks = data.contributions.weeks
  const c = data.contributions
  const snapshot = data.fetchedAt.slice(0, 10)
  const gridRight = GX + weeks.length * PITCH - (PITCH - CELL)

  // A week belongs to the month of its midweek day, so labels never collide.
  const weekMonth = (wi: number) => {
    const days = weeks[wi]?.days ?? []
    return days[Math.min(3, days.length - 1)]?.date.slice(5, 7)
  }
  const monthLabels = weeks
    .map((_, wi) => ({ wi, month: weekMonth(wi) }))
    .filter(({ wi, month }) => month && (wi === 0 || month !== weekMonth(wi - 1)))
    .map(({ wi }) => ({ x: GX + wi * PITCH, label: monthShort(weeks[wi].days[Math.min(3, weeks[wi].days.length - 1)].date) }))

  const lastWeek = weeks[weeks.length - 1].days
  const today = lastWeek[lastWeek.length - 1]
  const languages = data.languages.slice(0, 6)
  const maxShare = languages[0]?.share ?? 1
  const facts: [string, string][] = [
    ['COMMITS', fmt(c.commits)],
    ['PULL REQUESTS', fmt(c.prs)],
    ['LONGEST STREAK', `${c.longestStreak} DAYS`],
    ['CURRENT STREAK', `${c.currentStreak} DAYS`],
    ['BUSIEST DAY', `${dayLabel(c.busiest.date)} · ${c.busiest.count}`],
  ]
  const cellOf = (level: Level) => t.heat[level]

  return (
    <Root w={W} h={LAB_H} label={`The open lab — ${fmt(c.total)} contributions in the last year across ${fmt(data.repos.total)} public repositories`} theme={t}>
      <Card w={W} h={LAB_H} />

      {/* heading row */}
      <rect x={PAD} y={31} width={6} height={6} fill={t.accent} />
      <Label x={PAD + 14} y={37}>
        CONTRIBUTION CALENDAR
      </Label>
      <Mono x={PAD + 14 + textW('CONTRIBUTION CALENDAR', 'mono', 9.5, LABEL_TRACK) + 14} y={37} size={9.5} weight={500} track={LABEL_TRACK} color={t.ink}>
        {fmt(c.total)} IN THE LAST 365 DAYS
      </Mono>
      <Label x={W - PAD} y={37} anchor="end">
        SNAPSHOT {snapshot} · GITHUB GRAPHQL
      </Label>

      {/* calendar */}
      {monthLabels.map((m) => (
        <Label key={`${m.label}-${m.x}`} x={m.x} y={GY - 11} size={8.5}>
          {m.label}
        </Label>
      ))}
      {Object.entries(WEEKDAYS).map(([di, label]) => (
        <Label key={label} x={GX - 10} y={GY + Number(di) * PITCH + 9} size={8} anchor="end">
          {label}
        </Label>
      ))}
      {weeks.map((week, wi) => {
        const dur = f2(0.35 + wi * 0.022)
        const hold = f2((wi * 0.022) / dur)
        return (
          <g key={wi} opacity={1}>
            <animate attributeName="opacity" values="0;0;1" keyTimes={`0;${hold};1`} dur={`${dur}s`} fill="freeze" />
            {week.days.map((day) => {
              const di = new Date(`${day.date}T00:00:00Z`).getUTCDay()
              return <rect key={day.date} x={GX + wi * PITCH} y={GY + di * PITCH} width={CELL} height={CELL} rx={2.5} fill={cellOf(day.level)} />
            })}
          </g>
        )
      })}
      {(() => {
        const di = new Date(`${today.date}T00:00:00Z`).getUTCDay()
        const x = GX + (weeks.length - 1) * PITCH
        const y = GY + di * PITCH
        return (
          <rect x={x - 1.5} y={y - 1.5} width={CELL + 3} height={CELL + 3} rx={3.5} fill="none" stroke={t.accent} strokeWidth={1.2}>
            <animate attributeName="opacity" values=".25;1;.25" dur="1.8s" repeatCount="indefinite" />
          </rect>
        )
      })()}
      {/* legend */}
      <Label x={gridRight - 5 * 13 - 8} y={GY + 7 * PITCH + 16} size={8} anchor="end">
        LESS
      </Label>
      {t.heat.map((color, i) => (
        <rect key={color} x={gridRight - 5 * 13 + i * 13 + 2} y={GY + 7 * PITCH + 7} width={CELL} height={CELL} rx={2.5} fill={color} />
      ))}
      <Label x={gridRight + 10} y={GY + 7 * PITCH + 16} size={8}>
        MORE
      </Label>

      <Rule x1={PAD} x2={W - PAD} y={212} />

      {/* languages */}
      <Reveal delay={0.1}>
        <Label x={COLS.a} y={236}>
          LANGUAGES · BY BYTES, ORIGINAL REPOS
        </Label>
        {languages.map((lang, i) => {
          const y = ROW_Y + i * ROW_H
          const w = f1(Math.max(3, (lang.share / maxShare) * 128))
          const dur = f2(1.2 + i * 0.08)
          const hold = f2((0.3 + i * 0.08) / dur)
          return (
            <g key={lang.name}>
              <Mono x={COLS.a} y={y + 4} size={10} color={t.ink}>
                {lang.name.length > 14 ? `${lang.name.slice(0, 13)}…` : lang.name}
              </Mono>
              <rect x={COLS.a + 118} y={y - 2} width={128} height={4} rx={2} fill={t.faint} />
              <rect x={COLS.a + 118} y={y - 2} width={w} height={4} rx={2} fill={t.accent}>
                <animate attributeName="width" values={`0;0;${w}`} keyTimes={`0;${hold};1`} dur={`${dur}s`} fill="freeze" calcMode="spline" keySplines="0 0 1 1;.2 .75 .2 1" />
              </rect>
              <Mono x={COLS.a + 118 + 128 + 40} y={y + 4} size={10} weight={500} anchor="end" color={t.ink}>
                {lang.share.toFixed(1)}%
              </Mono>
            </g>
          )
        })}
      </Reveal>

      {/* activity */}
      <Reveal delay={0.2}>
        <Label x={COLS.b} y={236}>
          ACTIVITY · LAST 365 DAYS
        </Label>
        {facts.map(([label, value], i) => {
          const y = ROW_Y + i * ROW_H
          const right = COLS.b + 236
          const lw = textW(label, 'mono', 9.5, LABEL_TRACK)
          const vw = textW(value, 'monoMedium', 10)
          return (
            <g key={label}>
              <Label x={COLS.b} y={y + 4} color={t.body}>
                {label}
              </Label>
              <line x1={COLS.b + lw + 8} x2={right - vw - 8} y1={y + 2.5} y2={y + 2.5} stroke={t.faint} strokeDasharray="1 3" />
              <Mono x={right} y={y + 4} size={10} weight={500} anchor="end" color={t.ink}>
                {value}
              </Mono>
            </g>
          )
        })}
      </Reveal>

      {/* repositories */}
      <Reveal delay={0.3}>
        <Label x={COLS.c} y={236}>
          PUBLIC REPOSITORIES
        </Label>
        <Sans x={COLS.c - 1} y={296} size={48} weight={500} track={-0.02}>
          {fmt(data.repos.total)}
        </Sans>
        <Label x={COLS.c} y={318} color={t.body}>
          {data.repos.original} ORIGINAL · {data.repos.forks} FORKS · {data.repos.archived} ARCHIVED
        </Label>
        <Label x={COLS.c} y={334} color={t.body}>
          {data.repos.languageCount} LANGUAGES · SINCE {data.repos.firstYear}
        </Label>
      </Reveal>
      <LinkMark cx={W - PAD - 11} cy={LAB_H - 40} />
    </Root>
  )
}
