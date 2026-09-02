import { W, type Theme } from '../theme'
import { Root, Sans, Mono, Label, Rule, LABEL_TRACK } from '../primitives'
import { textW } from '../text'

export const DIVIDER_H = 40

/** Section heading row: numbered index, title, hairline, live meta on the right. Transparent background. */
export function Divider({ index, title, meta, theme: t }: { index: string; title: string; meta: string; theme: Theme }) {
  const titleW = textW(title, 'sans', 22)
  const metaW = textW(meta, 'mono', 9.5, LABEL_TRACK)
  return (
    <Root w={W} h={DIVIDER_H} label={`${index} — ${title}`} theme={t}>
      <Mono x={1} y={27} size={10} weight={500} track={LABEL_TRACK} color={t.accent}>
        {index}
      </Mono>
      <Sans x={30} y={29} size={22} weight={500} track={-0.012}>
        {title}
      </Sans>
      <Rule x1={30 + titleW + 14} x2={W - metaW - 16} y={23} />
      <Label x={W - 1} y={27} anchor="end">
        {meta}
      </Label>
    </Root>
  )
}
