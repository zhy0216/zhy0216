import { W, PAD, type Theme } from '../theme'
import { FOOTER } from '../content'
import { Root, Card, Sans, Mono, Label, Caret } from '../primitives'
import { textW } from '../text'
import type { Data } from '../data'

export const FOOTER_H = 96

/** Sign-off: an invitation with a blinking caret, and the colophon. */
export function Footer({ data, theme: t }: { data: Data; theme: Theme }) {
  const hw = textW(FOOTER.headline, 'sans', 26)
  return (
    <Root w={W} h={FOOTER_H} label={FOOTER.headline} theme={t}>
      <Card w={W} h={FOOTER_H} />
      <Sans x={PAD - 1} y={46} size={26} weight={500} track={-0.01}>
        {FOOTER.headline}
      </Sans>
      <Caret x={PAD + hw + 5} y={27} h={22} />
      <Mono x={PAD} y={69} size={11}>
        {FOOTER.copy}
      </Mono>
      <Label x={W - PAD} y={40} anchor="end">
        {FOOTER.colophon[0]}
      </Label>
      <Label x={W - PAD} y={56} anchor="end">
        {FOOTER.colophon[1]}
      </Label>
      <Label x={W - PAD} y={72} anchor="end" color={t.accent}>
        SNAPSHOT {data.fetchedAt.slice(0, 10)}
      </Label>
    </Root>
  )
}
