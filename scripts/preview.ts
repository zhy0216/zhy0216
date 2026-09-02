// Writes preview/light.html and preview/dark.html: the README markup inside a
// GitHub-like profile README box, with each <picture> resolved to that theme's
// SVG so both variants can be checked in any browser regardless of the OS
// colour scheme (fonts inlined, animations running).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const OUT = join(ROOT, 'preview')
mkdirSync(OUT, { recursive: true })

const source = readFileSync(join(ROOT, 'README.md'), 'utf8')
const PICTURE = /<picture><source media="\(prefers-color-scheme: dark\)" srcset="([^"]+)"><img src="([^"]+)"([^>]*)><\/picture>/g

for (const theme of ['light', 'dark'] as const) {
  const body = source.replace(PICTURE, (_, dark: string, light: string, attrs: string) => `<img src="${theme === 'dark' ? dark : light}"${attrs}>`).replaceAll('./assets/', '../assets/')
  const bg = theme === 'dark' ? '#0d1117' : '#ffffff'
  const fg = theme === 'dark' ? '#e6edf3' : '#1f2328'
  const border = theme === 'dark' ? '#30363d' : '#d0d7de'
  const link = theme === 'dark' ? '#4493f8' : '#0969da'
  const html = `<!doctype html>
<html lang="en" data-color-mode="${theme}">
<head>
<meta charset="utf-8" />
<title>README preview (${theme})</title>
<style>
  body{margin:0;background:${bg};color:${fg};font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif}
  .box{max-width:896px;margin:24px auto;border:1px solid ${border};border-radius:6px;box-sizing:border-box}
  .markdown-body{padding:16px;box-sizing:border-box}
  .markdown-body img{max-width:100%;box-sizing:content-box}
  .markdown-body p{margin:0 0 16px}
  .markdown-body details{margin-top:8px}
  a{color:${link}}
</style>
</head>
<body>
<div class="box"><article class="markdown-body">
${body}
</article></div>
</body>
</html>
`
  writeFileSync(join(OUT, `${theme}.html`), html)
}
console.log(`preview/light.html + preview/dark.html (open with file://${OUT}/light.html)`)
