# Fonts

Subset copies of the README's two typefaces — the same ones zhy0216.github.io
uses — inlined into every SVG as base64 `@font-face` sources (GitHub renders
README images inside an `<img>` sandbox that blocks external requests, so the
fonts have to travel with the file). The build only embeds the faces a block
actually uses (`src/fonts.ts`).

| File | Source | Subset |
| --- | --- | --- |
| `manrope-subset.woff2` | `@fontsource-variable/manrope` — `manrope-latin-wght-normal.woff2` (variable, wght 200–800, kept variable) | Basic Latin, Latin-1, dashes, quotes, ellipsis |
| `dm-mono-subset.woff2` | `@fontsource/dm-mono` — `dm-mono-latin-400-normal.woff2` | same |
| `dm-mono-medium-subset.woff2` | `@fontsource/dm-mono` — `dm-mono-latin-500-normal.woff2` | same |
| `metrics.json` | generated from the three subsets | per-glyph advance widths, used by `src/text.ts` to wrap and align text |

Regenerate with [fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`):

```sh
U="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2199,U+221E,U+25A0-25CF,U+2713"
sub() { python3 -m fontTools.subset "$1" --unicodes="$U" --flavor=woff2 --layout-features='*' --output-file="$2"; }
sub node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2 fonts/manrope-subset.woff2
sub node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2        fonts/dm-mono-subset.woff2
sub node_modules/@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2        fonts/dm-mono-medium-subset.woff2

python3 - <<'EOF'
import json
from fontTools.ttLib import TTFont
faces = {'sans': 'fonts/manrope-subset.woff2', 'mono': 'fonts/dm-mono-subset.woff2', 'monoMedium': 'fonts/dm-mono-medium-subset.woff2'}
out = {}
for key, path in faces.items():
    t = TTFont(path); upem = t['head'].unitsPerEm; cmap = t.getBestCmap(); hmtx = t['hmtx']
    out[key] = {'unitsPerEm': upem, 'advances': {chr(cp): round(hmtx[g][0] / upem, 4) for cp, g in cmap.items()}}
json.dump(out, open('fonts/metrics.json', 'w'), ensure_ascii=False, separators=(',', ':'))
EOF
```

The face names in `src/text.ts` are roles (`sans`, `mono`, `monoMedium`), not
the font files: `sans` measures the Manrope subset (advances are identical
across the wght axis, so one table serves every weight), while `mono` /
`monoMedium` measure the DM Mono 400 / 500 subsets. The advance width of the
two Manrope weights rendered in markup (300, 400, 500) does not change the
measurement.

Neither face ships arrows, geometric bullets or a check mark, so those are
drawn as SVG paths (`Arrow`, `LinkMark`, `Pulse` in `src/primitives.tsx`)
instead of text.

Manrope — SIL Open Font License 1.1. DM Mono — SIL Open Font License 1.1.
