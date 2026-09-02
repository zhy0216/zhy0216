import { W, PAD, type Theme } from '../theme'
import { Root, Card, Sans, Mono, Label, Chips, LinkMark, chipsW } from '../primitives'
import { clampW, clampLines, wrapW, dateLabel } from '../text'
import type { Post } from '../data'

export const NOTE_H = 84
const TEXT_X = 150

/** One essay as an index row: date, title, two lines of excerpt, tags. */
export function NoteRow({ post, theme: t }: { post: Post; theme: Theme }) {
  const tags = post.tags.slice(0, 3).map((s) => s.toUpperCase())
  const markX = W - PAD - 11
  const chipsEnd = markX - 11 - 20
  const textMax = chipsEnd - chipsW(tags) - 24 - TEXT_X
  const title = clampW(post.title, 'sans', 22, textMax)
  const excerpt = clampLines(wrapW(post.excerpt, 'mono', 10.5, textMax), 2)
  return (
    <Root w={W} h={NOTE_H} label={`${post.title} — ${post.excerpt}`} theme={t}>
      <Card w={W} h={NOTE_H} r={8} />
      <Label x={PAD} y={36}>
        {dateLabel(post.date)}
      </Label>
      <Sans x={TEXT_X - 1} y={36} size={22} weight={400}>
        {title}
      </Sans>
      {excerpt.map((line, i) => (
        <Mono key={i} x={TEXT_X} y={55 + i * 15} size={10.5}>
          {line}
        </Mono>
      ))}
      <Chips x={chipsEnd} y={NOTE_H / 2 - 10} labels={tags} anchor="end" />
      <LinkMark cx={markX} cy={NOTE_H / 2} />
    </Root>
  )
}
