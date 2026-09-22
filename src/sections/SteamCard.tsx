import { readFileSync } from 'node:fs'
import { STEAM } from '../content'
import { Root, Card, Sans, Label, Arrow } from '../primitives'
import { wrapW } from '../text'
import { W, type Theme } from '../theme'

// Keep the store artwork local and inline it: SVGs displayed as <img> cannot
// load external images, and the README build must work without network access.
const artwork = `data:image/jpeg;base64,${readFileSync(new URL('../images/steam-5268460-header.jpg', import.meta.url)).toString('base64')}`
const H = 220
const INSET = 24
const IMAGE_W = 300
const IMAGE_H = IMAGE_W * 215 / 460
const IMAGE_Y = (H - IMAGE_H) / 2
const TEXT_X = INSET + IMAGE_W + 28

/** GitHub-compatible store link; Steam's interactive iframe is not allowed in READMEs. */
export function SteamCard({ theme: t }: { theme: Theme }) {
  const description = wrapW(STEAM.description, 'sans', 14, W - TEXT_X - INSET)

  return (
    <Root w={W} h={H} label={`${STEAM.title} — ${STEAM.cta}`} theme={t}>
      <defs>
        <clipPath id="steam-art">
          <rect x={INSET} y={IMAGE_Y} width={IMAGE_W} height={IMAGE_H} rx={6} />
        </clipPath>
      </defs>
      <Card w={W} h={H} />
      <image href={artwork} x={INSET} y={IMAGE_Y} width={IMAGE_W} height={IMAGE_H} clipPath="url(#steam-art)" />

      <Label x={TEXT_X} y={39} color={t.accent}>ON STEAM · DECKBUILDING ROGUELIKE</Label>
      <Sans x={TEXT_X - 1} y={78} size={28} weight={500} track={-0.015}>{STEAM.title}</Sans>
      {description.map((line, i) => (
        <Sans key={i} x={TEXT_X} y={107 + i * 21} size={14} color={t.body}>{line}</Sans>
      ))}

      <rect x={TEXT_X} y={157} width={160} height={38} rx={5} fill={t.accent} />
      <Sans x={TEXT_X + 16} y={181} size={14} weight={600} color={t.onAccent}>{STEAM.cta}</Sans>
      <Arrow x={TEXT_X + 130} y={169} size={14} color={t.onAccent} />
    </Root>
  )
}
