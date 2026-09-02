import { CARD_W, type Theme } from '../theme'
import type { Project } from '../content'
import { Root, Card, Sans, Mono, Label, Chips, LinkMark, Hatch, useTheme } from '../primitives'
import { wrapW, clampLines, textW, dayLabel, f1, f2 } from '../text'
import { rng } from '../random'
import type { Data } from '../data'

export const CARD_H = 330
const ART_H = 150
const INSET = 24

/** One project card: a small animated diagram on top, spec-sheet metadata below. */
export function WorkCard({ project: p, data, theme: t }: { project: Project; data: Data; theme: Theme }) {
  const repo = data.repos.list.find((r) => r.name === p.repo)
  const meta = repo ? `${(repo.language ?? 'CODE').toUpperCase()} · ${dayLabel(repo.pushedAt)}` : ''
  const desc = clampLines(wrapW(p.description, 'mono', 11, CARD_W - INSET * 2), 3)
  const artClip = `M0.5 ${ART_H}V10.5A10 10 0 0 1 10.5 0.5H${CARD_W - 10.5}A10 10 0 0 1 ${CARD_W - 0.5} 10.5V${ART_H}Z`

  return (
    <Root w={CARD_W} h={CARD_H} label={`${p.title} — ${p.description}`} theme={t}>
      <defs>
        <clipPath id="art">
          <path d={artClip} />
        </clipPath>
        <Hatch id="hatch" color={t.accent} opacity={0.45} />
      </defs>
      <Card w={CARD_W} h={CARD_H} />
      <path d={artClip} fill={t.surface2} />
      <g clipPath="url(#art)">
        {p.variant === 'zebra' && <ZebraArt />}
        {p.variant === 'starwreck' && <StarwreckArt />}
        {p.variant === 'trigger' && <TriggerArt />}
        {p.variant === 'sangota' && <SangotaArt />}
      </g>
      <line x1={0.5} x2={CARD_W - 0.5} y1={ART_H + 0.5} y2={ART_H + 0.5} stroke={t.border} />

      <Label x={INSET} y={ART_H + 28}>
        {p.index} · {p.type}
      </Label>
      {meta && (
        <Label x={CARD_W - INSET} y={ART_H + 28} anchor="end" color={t.body}>
          {meta}
        </Label>
      )}
      <Sans x={INSET - 1} y={ART_H + 66} size={30} weight={500} track={-0.015}>
        {p.title}
      </Sans>
      {desc.map((line, i) => (
        <Mono key={i} x={INSET} y={ART_H + 88 + i * 16} size={11}>
          {line}
        </Mono>
      ))}
      <Chips x={INSET} y={CARD_H - 24 - 20} labels={p.tags} />
      <LinkMark cx={CARD_W - INSET - 11} cy={CARD_H - 34} />
    </Root>
  )
}

/* ------------------------------------------------------------------ art */

/** Zebra: a dependency graph being resolved from the root. */
function ZebraArt() {
  const t = useTheme()
  const nodes: Record<string, { label: string; x: number; y: number }> = {
    app: { label: 'App', x: 222, y: 40 },
    users: { label: 'UserService', x: 134, y: 86 },
    auth: { label: 'AuthService', x: 310, y: 86 },
    db: { label: 'Postgres', x: 86, y: 130 },
    cache: { label: 'Cache', x: 190, y: 130 },
    jwt: { label: 'Jwt', x: 310, y: 130 },
  }
  const edges: [string, string, number][] = [
    ['app', 'users', 0],
    ['app', 'auth', 0.4],
    ['users', 'db', 0.8],
    ['users', 'cache', 1.2],
    ['auth', 'jwt', 1.6],
    ['auth', 'cache', 2.0],
  ]
  const box = (n: { label: string; x: number; y: number }) => {
    const w = Math.round(textW(n.label, 'mono', 9, 0.04) + 18)
    return { x: n.x - w / 2, y: n.y - 11, w, h: 22 }
  }
  const path = (a: string, b: string) => {
    const A = nodes[a]
    const B = nodes[b]
    const y1 = A.y + 11
    const y2 = B.y - 11
    const ym = (y1 + y2) / 2
    return `M${A.x} ${y1}C${A.x} ${ym} ${B.x} ${ym} ${B.x} ${y2}`
  }
  return (
    <g>
      <Label x={16} y={22} size={8.5}>
        CONTAINER.RESOLVE(APP)
      </Label>
      {edges.map(([a, b, begin]) => (
        <g key={`${a}-${b}`}>
          <path d={path(a, b)} fill="none" stroke={t.ink} strokeOpacity={0.28} />
          <circle r={2.4} fill={t.accent} opacity={0}>
            <animateMotion dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" path={path(a, b)} />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {Object.entries(nodes).map(([k, n]) => {
        const b = box(n)
        const root = k === 'app'
        return (
          <g key={k}>
            <rect x={b.x + 0.5} y={b.y + 0.5} width={b.w - 1} height={b.h - 1} rx={4} fill={root ? t.accent : t.surface} stroke={root ? t.accent : t.ink} strokeOpacity={root ? 1 : 0.5} />
            <Mono x={n.x} y={n.y + 3.5} size={9} weight={root ? 500 : 400} track={0.04} anchor="middle" color={root ? t.onAccent : t.ink}>
              {n.label}
            </Mono>
          </g>
        )
      })}
    </g>
  )
}

// Ship silhouette welded from tiles; welding runs rear → nose.
const SHIP = ['...####.....', '.#########..', '############>', '.#########..', '...####.....']
const SW_CYCLE = 10

/** Starwreck: the ship is welded tile by tile, the swarm arrives, the broadside fires. */
function StarwreckArt() {
  const t = useTheme()
  const rand = rng(1177)
  const stars = Array.from({ length: 40 }, () => ({ x: f1(rand() * CARD_W), y: f1(rand() * ART_H), r: f1(0.5 + rand() * 0.9), o: f2(0.15 + rand() * 0.35) }))
  const tile = 13
  const ox = 100
  const oy = 42
  type Tile = { x: number; y: number; nose: boolean; accent: boolean }
  const tiles: Tile[] = []
  SHIP.forEach((row, ry) =>
    [...row].forEach((cell, rx) => {
      if (cell === '.') return
      tiles.push({ x: ox + rx * tile, y: oy + ry * tile, nose: cell === '>', accent: (rx === 5 && ry === 2) || (rx === 8 && ry === 1) || (rx === 8 && ry === 3) })
    }),
  )
  tiles.sort((a, b) => a.x - b.x || a.y - b.y)
  const T0 = 0.04
  const T1 = 0.6
  const at = (i: number) => f2(T0 + ((T1 - T0) * i) / tiles.length)
  const centers = tiles.map((tl) => ({ x: f1(tl.x + (tile - 1) / 2), y: f1(tl.y + (tile - 1) / 2) }))
  const sparkX = [centers[0], ...centers, centers[centers.length - 1]].map((c) => c.x).join(';')
  const sparkY = [centers[0], ...centers, centers[centers.length - 1]].map((c) => c.y).join(';')
  const sparkT = [0, ...tiles.map((_, i) => at(i)), 1].join(';')
  const noseX = ox + 12 * tile
  const noseY = oy + 2 * tile + (tile - 1) / 2
  const flameY1 = oy + 2 * tile + 2
  const flameY2 = oy + 3 * tile - 3
  const flameMid = (flameY1 + flameY2) / 2
  const dur = `${SW_CYCLE}s`

  return (
    <g>
      <g fill={t.ink}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>
      <Label x={16} y={22} size={8.5}>
        HANGAR · WELD SEQUENCE
      </Label>

      {/* hull */}
      {tiles.map((tl, i) => {
        const t0 = at(i)
        return (
          <g key={i}>
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${t0};${f2(t0 + 0.01)};.97;1`} dur={dur} repeatCount="indefinite" />
            {tl.nose ? (
              <path d={`M${tl.x} ${tl.y + 1}h4l8 ${(tile - 1) / 2 - 1}-8 ${(tile - 1) / 2 - 1}h-4z`} fill={t.ink} />
            ) : (
              <rect x={tl.x} y={tl.y} width={tile - 1} height={tile - 1} rx={1} fill={tl.accent ? t.accent : t.ink} fillOpacity={tl.accent ? 1 : 0.82} />
            )}
          </g>
        )
      })}

      {/* welding spark */}
      <g opacity={0}>
        <animate attributeName="opacity" values="1;1;0;0" keyTimes={`0;${T1};${f2(T1 + 0.01)};1`} dur={dur} repeatCount="indefinite" />
        <circle r={7} fill={t.accent} fillOpacity={0.22} cx={centers[0].x} cy={centers[0].y}>
          <animate attributeName="cx" values={sparkX} keyTimes={sparkT} calcMode="discrete" dur={dur} repeatCount="indefinite" />
          <animate attributeName="cy" values={sparkY} keyTimes={sparkT} calcMode="discrete" dur={dur} repeatCount="indefinite" />
        </circle>
        <circle r={2.5} fill={t.accent} cx={centers[0].x} cy={centers[0].y}>
          <animate attributeName="cx" values={sparkX} keyTimes={sparkT} calcMode="discrete" dur={dur} repeatCount="indefinite" />
          <animate attributeName="cy" values={sparkY} keyTimes={sparkT} calcMode="discrete" dur={dur} repeatCount="indefinite" />
          <animate attributeName="r" values="2;4;2" dur=".3s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* thruster, lit once the hull is complete */}
      <path d={`M${ox} ${flameY1}L${ox - 8} ${flameMid}L${ox} ${flameY2}Z`} fill={t.accent} opacity={0}>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes={`0;${T1};${f2(T1 + 0.02)};.97;1`} dur={dur} repeatCount="indefinite" />
        <animate attributeName="d" values={`M${ox} ${flameY1}L${ox - 7} ${flameMid}L${ox} ${flameY2}Z;M${ox} ${flameY1}L${ox - 13} ${flameMid}L${ox} ${flameY2}Z;M${ox} ${flameY1}L${ox - 7} ${flameMid}L${ox} ${flameY2}Z`} dur=".45s" repeatCount="indefinite" />
      </path>

      {/* the swarm closes in */}
      <g opacity={0}>
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.5;.56;.84;.87;1" dur={dur} repeatCount="indefinite" />
        <animateTransform attributeName="transform" type="translate" values="60 0;60 0;-90 0;-90 0" keyTimes="0;.5;.82;1" dur={dur} repeatCount="indefinite" />
        {[
          { x: 400, y: 56, r: 7 },
          { x: 418, y: 80, r: 10 },
          { x: 396, y: 104, r: 6 },
        ].map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={t.accent} fillOpacity={0.15} stroke={t.accent} strokeOpacity={0.75} />
        ))}
      </g>

      {/* broadside */}
      {[56, 104].map((y2, i) => {
        const k = [0.82 + i * 0.02, 0.83 + i * 0.02, 0.9 + i * 0.02].map((v) => f2(v))
        const keyTimes = `0;${k[0]};${k[1]};${k[2]};1`
        return (
          <g key={y2} strokeLinecap="round">
            <line x1={noseX + 8} y1={noseY} x2={318} y2={y2} stroke={t.accent} strokeWidth={4} strokeOpacity={0}>
              <animate attributeName="stroke-opacity" values="0;0;.35;0;0" keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
            </line>
            <line x1={noseX + 8} y1={noseY} x2={318} y2={y2} stroke={t.accent} strokeWidth={1.2} strokeOpacity={0}>
              <animate attributeName="stroke-opacity" values="0;0;1;0;0" keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
            </line>
          </g>
        )
      })}
    </g>
  )
}

const TG_CYCLE = 9

/** better-trigger: run 1 crashes at step 3; run 2 replays the memoized steps and finishes. */
function TriggerArt() {
  const t = useTheme()
  const cells = ['STEP 1', 'STEP 2', 'STEP 3', 'STEP 4', 'DONE']
  const X0 = 90
  const CW = 63
  const GAP = 6
  const H = 26
  const rows = [
    { y: 40, name: 'RUN 01', sub: 'CRASHED' },
    { y: 98, name: 'RUN 02', sub: 'REPLAYED' },
  ]
  const cx = (i: number) => X0 + i * (CW + GAP)
  const dur = `${TG_CYCLE}s`
  const run1Fill = [0.12, 0.22, 0.32]
  const Cell = ({ x, y, fill, keyTimes, hatch = false }: { x: number; y: number; fill: string; keyTimes: string; hatch?: boolean }) => (
    <rect x={x + 1} y={y + 1} width={CW - 2} height={H - 2} rx={3.5} fill={hatch ? 'url(#hatch)' : fill} opacity={1}>
      <animate attributeName="opacity" values="0;0;1;1" keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
    </rect>
  )

  return (
    <g>
      <Label x={16} y={22} size={8.5}>
        STEP LEDGER · POSTGRES
      </Label>
      {rows.map((r, ri) => (
        <g key={r.name} opacity={1}>
          {ri === 0 ? (
            <animate attributeName="opacity" values="1;1;.4;.4;1" keyTimes="0;.4;.46;.97;1" dur={dur} repeatCount="indefinite" />
          ) : (
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.46;.52;.97;1" dur={dur} repeatCount="indefinite" />
          )}
          <Mono x={16} y={r.y + 12} size={8.5} weight={500} track={0.06} color={t.ink}>
            {r.name}
          </Mono>
          <Label x={16} y={r.y + 23} size={7.5}>
            {r.sub}
          </Label>
          {cells.map((c, i) => (
            <g key={c}>
              <rect x={cx(i) + 0.5} y={r.y + 0.5} width={CW - 1} height={H - 1} rx={4} fill={t.surface} stroke={t.faint} />
              {ri === 0 && i < 3 && <Cell x={cx(i)} y={r.y} fill={t.accentSoft} keyTimes={`0;${run1Fill[i]};${f2(run1Fill[i] + 0.02)};1`} />}
              {ri === 1 && i < 3 && <Cell x={cx(i)} y={r.y} fill={t.accentSoft} hatch keyTimes={`0;${f2(0.52 + i * 0.03)};${f2(0.54 + i * 0.03)};1`} />}
              {ri === 1 && i === 3 && <Cell x={cx(i)} y={r.y} fill={t.accentSoft} keyTimes="0;.72;.74;1" />}
              {ri === 1 && i === 4 && <Cell x={cx(i)} y={r.y} fill={t.accent} keyTimes="0;.84;.86;1" />}
              {ri === 1 && i === 4 && (
                <Mono x={cx(i) + CW / 2} y={r.y + 16.5} size={8} weight={500} track={0.06} anchor="middle" color={t.onAccent} opacity={1}>
                  <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.84;.86;1" dur={dur} repeatCount="indefinite" />
                  {c}
                </Mono>
              )}
              <Mono x={cx(i) + CW / 2} y={r.y + 16.5} size={8} track={0.06} anchor="middle" color={t.ink} opacity={ri === 1 && i === 4 ? 0 : 1}>
                {ri === 1 && i === 4 && <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.84;.86;1" dur={dur} repeatCount="indefinite" />}
                {c}
              </Mono>
            </g>
          ))}
        </g>
      ))}

      {/* cursors */}
      <rect x={cx(0)} y={rows[0].y} width={2} height={H} fill={t.accent} opacity={0}>
        <animate attributeName="x" values={`${cx(0)};${cx(0)};${cx(2) + CW - 2};${cx(2) + CW - 2}`} keyTimes="0;.03;.36;1" dur={dur} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.03;.04;.36;.37;1" dur={dur} repeatCount="indefinite" />
      </rect>
      <rect x={cx(3)} y={rows[1].y} width={2} height={H} fill={t.accent} opacity={0}>
        <animate attributeName="x" values={`${cx(3)};${cx(3)};${cx(4) + CW - 2};${cx(4) + CW - 2}`} keyTimes="0;.62;.84;1" dur={dur} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.62;.63;.84;.85;1" dur={dur} repeatCount="indefinite" />
      </rect>

      {/* crash */}
      <g opacity={1}>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.36;.37;.97;1" dur={dur} repeatCount="indefinite" />
        <circle cx={cx(2) + CW - 2} cy={rows[0].y - 2} r={8} fill={t.surface2} stroke={t.accent} />
        <path transform={`translate(${cx(2) + CW - 8} ${rows[0].y - 8})`} d="M7 0 2 7h4l-1 5 5-7H6z" fill={t.accent} />
      </g>

      {/* what happened between the runs */}
      <Label x={cx(0)} y={rows[0].y + H + 19} size={7.5} opacity={1}>
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.5;.52;.97;1" dur={dur} repeatCount="indefinite" />
        MEMO HIT x3 · RESUME AT STEP 4 · NO WORK REPEATED
      </Label>
    </g>
  )
}

/** Sangota: three kingdoms, three roads, one general walking them. */
function SangotaArt() {
  const t = useTheme()
  const nodes = [
    { name: 'WEI', x: 296, y: 44, lx: 12, ly: -6, anchor: 'start' as const },
    { name: 'SHU', x: 118, y: 108, lx: -14, ly: 4, anchor: 'end' as const },
    { name: 'WU', x: 356, y: 118, lx: 14, ly: 4, anchor: 'start' as const },
  ]
  const route = `M${nodes[1].x} ${nodes[1].y}L${nodes[0].x} ${nodes[0].y}L${nodes[2].x} ${nodes[2].y}Z`
  // Arrival fractions of the paced motion along the three legs.
  const leg = (a: number, b: number) => Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y)
  const total = leg(1, 0) + leg(0, 2) + leg(2, 1)
  const arrive = [f2(leg(1, 0) / total), f2((leg(1, 0) + leg(0, 2)) / total), 0]
  const dur = '9s'
  return (
    <g>
      <g fill="none" stroke={t.ink} strokeOpacity={0.12}>
        <path d="M0 128C70 96 130 150 210 118S330 70 445 100" />
        <path d="M0 70C60 60 110 96 180 78S300 20 445 46" />
        <path d="M40 150C120 128 200 156 300 134S400 116 445 132" />
      </g>
      <path d="M-4 92C50 74 90 120 160 100S250 46 300 70 400 126 450 104" fill="none" stroke={t.ink} strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
      <Label x={16} y={22} size={8.5}>
        MAP · ACT I · THREE ROADS
      </Label>
      <path d={route} fill="none" stroke={t.ink} strokeOpacity={0.45} strokeDasharray="3 4" strokeLinejoin="round" />
      {nodes.map((n, i) => {
        const a = arrive[i]
        const keyTimes = a === 0 ? '0;.12;1' : `0;${a};${f2(a + 0.12)};1`
        return (
          <g key={n.name}>
            <circle cx={n.x} cy={n.y} r={3} fill="none" stroke={t.accent} strokeWidth={1.2} opacity={0}>
              <animate attributeName="r" values={a === 0 ? '3;16;16' : `3;3;16;16`} keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
              <animate attributeName="opacity" values={a === 0 ? '.85;0;0' : '0;.85;0;0'} keyTimes={keyTimes} dur={dur} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r={9} fill={t.surface2} stroke={t.ink} strokeOpacity={0.5} />
            <circle cx={n.x} cy={n.y} r={3} fill={t.ink} />
            <Mono x={n.x + n.lx} y={n.y + n.ly} size={8.5} weight={500} track={0.1} color={t.ink} anchor={n.anchor}>
              {n.name}
            </Mono>
          </g>
        )
      })}
      <g>
        <animateMotion dur={dur} repeatCount="indefinite" path={route} />
        <rect x={-5} y={-5} width={10} height={10} fill={t.accent} stroke={t.surface2} strokeWidth={1.5} transform="rotate(45)" />
      </g>
    </g>
  )
}
