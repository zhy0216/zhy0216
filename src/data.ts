import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type Level = 0 | 1 | 2 | 3 | 4

export interface Day {
  date: string
  count: number
  level: Level
}

export interface RepoLite {
  name: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  isFork: boolean
  isArchived: boolean
  createdAt: string
  pushedAt: string
}

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  url: string
}

export interface Data {
  fetchedAt: string
  user: {
    login: string
    name: string
    createdAt: string
    followers: number
    following: number
    gists: number
  }
  repos: {
    total: number
    original: number
    forks: number
    archived: number
    stars: number
    firstYear: number
    lastYear: number
    languageCount: number
    list: RepoLite[]
  }
  languages: { name: string; color: string | null; bytes: number; share: number }[]
  contributions: {
    total: number
    commits: number
    prs: number
    issues: number
    reviews: number
    restricted: number
    busiest: { date: string; count: number }
    longestStreak: number
    currentStreak: number
    weeks: { days: Day[] }[]
  }
  pinned: { name: string; description: string | null; url: string; stars: number; language: string | null }[]
  posts: Post[]
}

export const DATA_PATH = join(import.meta.dir, '..', 'data', 'github.json')

export function loadData(): Data {
  if (!existsSync(DATA_PATH)) {
    throw new Error(`Missing ${DATA_PATH}. Run \`bun run fetch\` first (needs GITHUB_TOKEN or a logged-in gh CLI).`)
  }
  return JSON.parse(readFileSync(DATA_PATH, 'utf8')) as Data
}
