import type { ReactElement } from 'react'
import { SITE, BLOG, GITHUB, LINKEDIN, type Theme } from './theme'
import { PROJECTS, WORK, LAB, NOTES, HEADER, FOOTER } from './content'
import { fmt, pad2 } from './text'
import { Header } from './sections/Header'
import { Divider } from './sections/Divider'
import { WorkCard } from './sections/WorkCard'
import { Lab } from './sections/Lab'
import { NoteRow } from './sections/NoteRow'
import { Footer } from './sections/Footer'
import type { Data } from './data'

export interface Block {
  /** File name under assets/<theme>/. */
  file: string
  alt: string
  href?: string
  width: '100%' | '49.5%'
  render: (theme: Theme) => ReactElement
}

/** A README row: one full-width block, or two cards side by side. */
export type Row = Block[]

/** The page, top to bottom. Shared by the SVG build and the README generator. */
export function page(data: Data): Row[] {
  const rows: Row[] = []
  const full = (file: string, alt: string, href: string | undefined, render: Block['render']): Row => [{ file, alt, href, width: '100%', render }]

  rows.push(full('header.svg', `${HEADER.hello} ${HEADER.tagline.join(' ')} — ${HEADER.intro}`, SITE, (t) => <Header data={data} theme={t} />))

  rows.push(full('divider-work.svg', `${WORK.index} — ${WORK.title}`, `${SITE}/work/`, (t) => <Divider index={WORK.index} title={WORK.title} meta={`${pad2(PROJECTS.length)} PROJECTS · ${WORK.meta}`} theme={t} />))
  for (let i = 0; i < PROJECTS.length; i += 2) {
    rows.push(
      PROJECTS.slice(i, i + 2).map((p) => ({
        file: `work-${p.slug}.svg`,
        alt: `${p.title} — ${p.description}`,
        href: p.href,
        width: '49.5%' as const,
        render: (t: Theme) => <WorkCard project={p} data={data} theme={t} />,
      })),
    )
  }

  rows.push(full('divider-lab.svg', `${LAB.index} — ${LAB.title}`, `${GITHUB}?tab=repositories`, (t) => <Divider index={LAB.index} title={LAB.title} meta={`${fmt(data.repos.total)} PUBLIC REPOSITORIES · SINCE ${data.repos.firstYear}`} theme={t} />))
  rows.push(full('lab.svg', `The open lab — ${fmt(data.contributions.total)} contributions in the last year, languages and activity`, `${GITHUB}?tab=repositories`, (t) => <Lab data={data} theme={t} />))

  const posts = data.posts.slice(0, 4)
  if (posts.length) {
    rows.push(full('divider-notes.svg', `${NOTES.index} — ${NOTES.title}`, BLOG, (t) => <Divider index={NOTES.index} title={NOTES.title} meta={`${pad2(data.posts.length)} NOTES · ${NOTES.meta}`} theme={t} />))
    posts.forEach((post, i) => rows.push(full(`note-${i + 1}.svg`, `${post.title} — ${post.excerpt}`, post.url, (t) => <NoteRow post={post} theme={t} />)))
  }

  rows.push(full('footer.svg', `${FOOTER.headline} — ${FOOTER.copy}`, LINKEDIN, (t) => <Footer data={data} theme={t} />))
  return rows
}
