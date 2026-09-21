// Performance budget for the initial payload: everything index.html pulls in
// before React renders (entry chunk, its modulepreloads and the stylesheet).
// Lazy route chunks are excluded on purpose, they are the reward for splitting.
import { readFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { resolve, join } from 'node:path'

const DIST = resolve(import.meta.dirname, '..', 'dist')
const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 190)

const PATTERNS = [
  /<script[^>]+type="module"[^>]+src="([^"]+)"/g,
  /<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g,
  /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g,
]

const html = await readFile(join(DIST, 'index.html'), 'utf8')

const assets = new Set()
for (const pattern of PATTERNS) {
  for (const [, href] of html.matchAll(pattern)) {
    assets.add(href.replace(/^.*\/assets\//, 'assets/'))
  }
}

if (assets.size === 0) {
  console.error('No entry assets found in dist/index.html. Did the build run?')
  process.exit(1)
}

let total = 0
const rows = []

for (const asset of [...assets].sort()) {
  const file = join(DIST, asset)
  await stat(file).catch(() => {
    console.error(`Referenced asset is missing from dist: ${asset}`)
    process.exit(1)
  })
  const gzipped = gzipSync(await readFile(file), { level: 9 }).length
  total += gzipped
  rows.push({ asset, kb: gzipped / 1024 })
}

const totalKb = total / 1024
const format = (kb) => `${kb.toFixed(2)} kB`

console.log('Initial payload (gzip):')
for (const { asset, kb } of rows) console.log(`  ${asset.padEnd(44)} ${format(kb)}`)
console.log(`  ${'total'.padEnd(44)} ${format(totalKb)} / ${BUDGET_KB} kB budget`)

if (totalKb > BUDGET_KB) {
  console.error(
    `\nBudget exceeded by ${format(totalKb - BUDGET_KB)}. Split the new dependency into a lazy route or raise BUNDLE_BUDGET_KB deliberately.`,
  )
  process.exit(1)
}
