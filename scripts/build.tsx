// Renders every block to assets/light/*.svg and assets/dark/*.svg and
// regenerates README.md. Pure function of src/ + data/github.json — no network.
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { loadData } from '../src/data'
import { THEMES } from '../src/theme'
import { inlineFonts } from '../src/fonts'
import { page } from '../src/page'
import { readme } from '../src/readme'

const ROOT = join(import.meta.dir, '..')
const ASSETS = join(ROOT, 'assets')

const data = loadData()
const rows = page(data)
const blocks = rows.flat()
const produced = new Set<string>()
let total = 0

for (const theme of Object.values(THEMES)) {
  const dir = join(ASSETS, theme.name)
  mkdirSync(dir, { recursive: true })
  console.log(`${theme.name}/`)
  for (const block of blocks) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${inlineFonts(renderToStaticMarkup(block.render(theme)))}\n`
    writeFileSync(join(dir, block.file), svg)
    produced.add(join(theme.name, block.file))
    total += svg.length
    console.log(`  ${block.file.padEnd(24)} ${(svg.length / 1024).toFixed(1).padStart(7)} KB`)
  }
}

// Drop whatever an earlier build left behind (renamed blocks, fewer notes, the
// old single-theme layout) so the committed assets/ mirrors this build.
const walk = (dir: string): string[] => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name)]))
for (const file of walk(ASSETS)) {
  if (!produced.has(relative(ASSETS, file))) {
    rmSync(file)
    console.log(`  - removed stale ${relative(ROOT, file)}`)
  }
}

writeFileSync(join(ROOT, 'README.md'), readme(data, rows))
console.log(`\n${blocks.length} blocks × 2 themes, ${(total / 1024).toFixed(0)} KB → assets/, README.md`)
