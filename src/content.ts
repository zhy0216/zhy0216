import { SITE } from './theme'

// README copy. First person, document-toned — this is a profile page, not a
// landing page, so it says what the homepage's manifesto leaves implicit.
export const HEADER = {
  kicker: 'YANG ZHANG · FULL-STACK ENGINEER · SHANGHAI',
  status: 'NOW · BUILDING AI PRODUCTS',
  hello: "Hi, I'm Yang.",
  tagline: ['Frameworks, runtimes', '& small worlds.'],
  intro:
    'Ten-plus years on the web, lately building AI products — billing, real-time analytics and low-code platforms — in React, TypeScript and Bun. After hours: frameworks, runtimes and roguelikes.',
  stack: ['REACT', 'TYPESCRIPT', 'BUN', 'POSTGRES', 'GO', 'SCALA', 'LLM'],
  chartLabel: 'CONTRIBUTIONS · 52 WEEKS',
}

export type ProjectVariant = 'zebra' | 'starwreck' | 'trigger' | 'sangota'

export interface Project {
  index: string
  title: string
  type: string
  description: string
  tags: string[]
  variant: ProjectVariant
  href: string
  slug: string
  /** GitHub repository the card's language / last-push line is read from. */
  repo: string
}

export const PROJECTS: Project[] = [
  {
    index: '01',
    title: 'Zebra',
    type: 'WEB FRAMEWORK · OPEN SOURCE',
    description: 'A TypeScript web framework built on Bun.serve, with first-class dependency injection and typed contracts.',
    tags: ['BUN', 'TYPESCRIPT', 'OPEN SOURCE'],
    variant: 'zebra',
    href: `${SITE}/work/zebra/`,
    slug: 'zebra',
    repo: 'zebra',
  },
  {
    index: '02',
    title: 'Starwreck',
    type: 'SPACE-SURVIVAL ROGUELITE',
    description: 'Weld a warship tile by tile, then turn into the swarm and fire a broadside you designed yourself.',
    tags: ['TYPESCRIPT', 'PIXIJS', 'ELECTRON'],
    variant: 'starwreck',
    href: `${SITE}/work/starwreck/`,
    slug: 'starwreck',
    repo: 'spacecraft-survivor',
  },
  {
    index: '03',
    title: 'better-trigger',
    type: 'DURABLE EXECUTION · OPEN SOURCE',
    description: 'Steps are memoized in Postgres, so a workflow replays through waits, restarts and crashes and picks up where it stopped.',
    tags: ['TYPESCRIPT', 'POSTGRESQL', 'RUNTIME'],
    variant: 'trigger',
    href: `${SITE}/work/better-trigger/`,
    slug: 'better-trigger',
    repo: 'better-trigger',
  },
  {
    index: '04',
    title: 'Sangota',
    type: 'THREE KINGDOMS ROGUELIKE',
    description: 'A deck-building roguelike in the spirit of Slay the Spire: pick a general, read the road ahead, build the deck that wins the next fight.',
    tags: ['PHASER 3', 'TYPESCRIPT', 'GAME SYSTEMS'],
    variant: 'sangota',
    href: `${SITE}/work/sangota/`,
    slug: 'sangota',
    repo: 'sangota',
  },
]

export const WORK = {
  index: '01',
  title: 'Selected work',
  meta: 'MORE AT ZHY0216.GITHUB.IO/WORK',
}

export const LAB = {
  index: '02',
  title: 'The open lab',
  meta: 'EVERY PUBLIC REPOSITORY',
}

export const NOTES = {
  index: '03',
  title: 'Field notes',
  meta: 'ESSAYS AT ZHY0216.GITHUB.IO/BLOG',
}

export const FOOTER = {
  headline: 'Open to interesting problems',
  copy: 'Say hello on LinkedIn or GitHub — links just below. Shanghai, UTC+8.',
  colophon: ['RENDERED FROM REACT TO SVG · NO JAVASCRIPT', 'REFRESHED DAILY BY GITHUB ACTIONS'],
}
