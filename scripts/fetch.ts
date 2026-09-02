// Pulls everything the SVGs need from GitHub into data/github.json:
// profile counts, repositories, language bytes, the contribution calendar,
// pinned repos and the homepage blog index. Needs a token (GitHub GraphQL has
// no anonymous access): GITHUB_TOKEN in the environment, or a logged-in gh CLI.
import { $ } from 'bun'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DATA_PATH, type Data, type Day, type Level, type Post, type RepoLite } from '../src/data'
import { SITE } from '../src/theme'

const LOGIN = 'zhy0216'
const SITE_REPO = 'zhy0216/zhy0216.github.io'
const UA = 'zhy0216-readme-builder'

async function getToken(): Promise<string> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  try {
    const token = (await $`gh auth token`.quiet().text()).trim()
    if (token) return token
  } catch {
    /* fall through */
  }
  throw new Error('Set GITHUB_TOKEN (or log in with `gh auth login`); the GitHub GraphQL API requires a token.')
}

const REPO_FIELDS = `
  name description isFork isArchived stargazerCount forkCount createdAt pushedAt
  primaryLanguage { name color }
  languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
`

const USER_QUERY = `
query($login: String!) {
  user(login: $login) {
    login name createdAt
    followers { totalCount }
    following { totalCount }
    gists { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes { ${REPO_FIELDS} }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { name description url stargazerCount primaryLanguage { name } } }
    }
    contributionsCollection {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
    }
  }
}`

const MORE_REPOS_QUERY = `
query($login: String!, $after: String!) {
  user(login: $login) {
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC }) {
      pageInfo { hasNextPage endCursor }
      nodes { ${REPO_FIELDS} }
    }
  }
}`

interface GqlRepo {
  name: string
  description: string | null
  isFork: boolean
  isArchived: boolean
  stargazerCount: number
  forkCount: number
  createdAt: string
  pushedAt: string
  primaryLanguage: { name: string; color: string } | null
  languages: { edges: { size: number; node: { name: string; color: string | null } }[] }
}

async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': UA },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)
  if (!json.data) throw new Error('GraphQL returned no data')
  return json.data
}

const LEVELS: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

/** Minimal front matter reader: `key: value`, quoted strings, JSON-ish arrays. */
function frontMatter(source: string): Record<string, unknown> {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return {}
  const out: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const raw = line.slice(sep + 1).trim()
    if (!key) continue
    if (raw.startsWith('[')) {
      try {
        out[key] = JSON.parse(raw)
      } catch {
        out[key] = raw.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      }
    } else {
      out[key] = raw.replace(/^['"]|['"]$/g, '')
    }
  }
  return out
}

async function fetchPosts(token: string): Promise<Post[]> {
  const headers = { authorization: `bearer ${token}`, 'user-agent': UA, accept: 'application/vnd.github+json' }
  const res = await fetch(`https://api.github.com/repos/${SITE_REPO}/contents/blogs`, { headers })
  if (!res.ok) {
    console.warn(`  ! could not list blog posts (${res.status}); continuing without notes`)
    return []
  }
  const entries = (await res.json()) as { name: string; download_url: string }[]
  const posts = await Promise.all(
    entries
      .filter((entry) => entry.name.endsWith('.md'))
      .map(async (entry) => {
        const markdown = await (await fetch(entry.download_url, { headers: { 'user-agent': UA } })).text()
        const fm = frontMatter(markdown)
        const slug = entry.name.replace(/\.md$/, '')
        return {
          slug,
          title: String(fm.title ?? slug),
          date: String(fm.date ?? ''),
          excerpt: String(fm.excerpt ?? ''),
          tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
          url: `${SITE}/blog/?post=${encodeURIComponent(slug)}`,
        }
      }),
  )
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

function streaks(days: Day[]): { longest: number; current: number } {
  let longest = 0
  let run = 0
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) current += 1
    else if (i === days.length - 1) continue // today may simply not have happened yet
    else break
  }
  return { longest, current }
}

async function main() {
  const token = await getToken()
  console.log(`Fetching GitHub data for @${LOGIN} …`)

  type UserResult = {
    user: {
      login: string
      name: string | null
      createdAt: string
      followers: { totalCount: number }
      following: { totalCount: number }
      gists: { totalCount: number }
      repositories: { totalCount: number; pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: GqlRepo[] }
      pinnedItems: { nodes: { name: string; description: string | null; url: string; stargazerCount: number; primaryLanguage: { name: string } | null }[] }
      contributionsCollection: {
        totalCommitContributions: number
        totalPullRequestContributions: number
        totalIssueContributions: number
        totalPullRequestReviewContributions: number
        restrictedContributionsCount: number
        contributionCalendar: { totalContributions: number; weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[] }
      }
    }
  }

  const { user } = await graphql<UserResult>(token, USER_QUERY, { login: LOGIN })
  const repos: GqlRepo[] = [...user.repositories.nodes]
  let page = user.repositories.pageInfo
  while (page.hasNextPage) {
    const more = await graphql<{ user: { repositories: UserResult['user']['repositories'] } }>(token, MORE_REPOS_QUERY, { login: LOGIN, after: page.endCursor })
    repos.push(...more.user.repositories.nodes)
    page = more.user.repositories.pageInfo
  }

  const list: RepoLite[] = repos.map((r) => ({
    name: r.name,
    description: r.description,
    stars: r.stargazerCount,
    forks: r.forkCount,
    language: r.primaryLanguage?.name ?? null,
    isFork: r.isFork,
    isArchived: r.isArchived,
    createdAt: r.createdAt,
    pushedAt: r.pushedAt,
  }))

  // Language share by bytes across the repositories Yang authored.
  const bytes = new Map<string, { bytes: number; color: string | null }>()
  for (const repo of repos) {
    if (repo.isFork) continue
    for (const edge of repo.languages.edges) {
      const entry = bytes.get(edge.node.name) ?? { bytes: 0, color: edge.node.color }
      entry.bytes += edge.size
      bytes.set(edge.node.name, entry)
    }
  }
  const totalBytes = [...bytes.values()].reduce((sum, v) => sum + v.bytes, 0) || 1
  const languages = [...bytes.entries()]
    .map(([name, v]) => ({ name, color: v.color, bytes: v.bytes, share: Math.round((v.bytes / totalBytes) * 1000) / 10 }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8)

  const calendar = user.contributionsCollection.contributionCalendar
  const weeks = calendar.weeks.map((week) => ({
    days: week.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
  }))
  const days = weeks.flatMap((w) => w.days)
  const busiest = days.reduce((best, day) => (day.count > best.count ? day : best), days[0])
  const { longest, current } = streaks(days)

  const years = list.map((r) => Number(r.createdAt.slice(0, 4)))
  const pushedYears = list.map((r) => Number(r.pushedAt.slice(0, 4)))
  const cc = user.contributionsCollection

  const data: Data = {
    fetchedAt: new Date().toISOString(),
    user: {
      login: user.login,
      name: user.name ?? user.login,
      createdAt: user.createdAt,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      gists: user.gists.totalCount,
    },
    repos: {
      total: user.repositories.totalCount,
      original: list.filter((r) => !r.isFork).length,
      forks: list.filter((r) => r.isFork).length,
      archived: list.filter((r) => r.isArchived).length,
      stars: list.filter((r) => !r.isFork).reduce((sum, r) => sum + r.stars, 0),
      firstYear: Math.min(...years),
      lastYear: Math.max(...pushedYears),
      languageCount: new Set(list.map((r) => r.language).filter(Boolean)).size,
      list,
    },
    languages,
    contributions: {
      total: calendar.totalContributions,
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      restricted: cc.restrictedContributionsCount,
      busiest: { date: busiest.date, count: busiest.count },
      longestStreak: longest,
      currentStreak: current,
      weeks,
    },
    pinned: user.pinnedItems.nodes.map((p) => ({ name: p.name, description: p.description, url: p.url, stars: p.stargazerCount, language: p.primaryLanguage?.name ?? null })),
    posts: await fetchPosts(token),
  }

  mkdirSync(dirname(DATA_PATH), { recursive: true })
  writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`)
  console.log(
    [
      `  repos ${data.repos.total} (original ${data.repos.original} / forks ${data.repos.forks} / archived ${data.repos.archived}), stars ${data.repos.stars}`,
      `  contributions ${data.contributions.total} over ${days.length} days, busiest ${busiest.date} (${busiest.count}), longest streak ${longest}`,
      `  languages ${languages.map((l) => `${l.name} ${l.share}%`).join(', ')}`,
      `  posts ${data.posts.length}`,
      `→ ${DATA_PATH}`,
    ].join('\n'),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
