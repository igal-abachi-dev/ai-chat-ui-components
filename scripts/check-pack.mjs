import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
})
const result = JSON.parse(output)[0]
const paths = new Set(result.files.map((file) => file.path))
const required = [
  'dist/index.js',
  'dist/surface.js',
  'dist/composer.js',
  'dist/messages.js',
  'dist/markdown.js',
  'dist/utils.js',
  'dist/styles.css',
  'dist/types/index.d.ts',
  'dist/types/entries/surface.d.ts',
  'dist/types/entries/composer.d.ts',
  'dist/types/entries/messages.d.ts',
  'dist/types/entries/markdown.d.ts',
  'dist/types/entries/utils.d.ts',
  'README.md',
  'LICENSE',
  'package.json',
]

for (const file of required) {
  if (!paths.has(file)) {
    throw new Error(`npm package is missing required file: ${file}`)
  }
}

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)),
)
if (packageJson.private === true) {
  throw new Error('package.json must not be private before publishing')
}

console.log(
  `Package dry-run OK: ${result.filename} (${result.size} bytes, ${result.entryCount} files)`,
)
