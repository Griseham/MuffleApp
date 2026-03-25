import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const applyChanges = process.argv.includes('--apply')

const targets = [
  path.join(rootDir, 'apps', 'threads', 'dist'),
  path.join(rootDir, 'backend', 'cached_media'),
  path.join(rootDir, 'apps', 'threads', 'src', 'backend', 'cached_media')
]

function getDirectorySize(targetPath) {
  if (!fs.existsSync(targetPath)) return 0

  const stats = fs.statSync(targetPath)
  if (!stats.isDirectory()) return stats.size

  let total = 0
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    total += getDirectorySize(path.join(targetPath, entry.name))
  }
  return total
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

let totalBytes = 0

for (const target of targets) {
  const size = getDirectorySize(target)
  totalBytes += size
  const exists = fs.existsSync(target)

  if (applyChanges && exists) {
    fs.rmSync(target, { recursive: true, force: true })
  }

  const status = applyChanges
    ? exists ? 'removed' : 'missing'
    : exists ? 'would remove' : 'missing'

  console.log(`${status}: ${path.relative(rootDir, target)} (${formatBytes(size)})`)
}

console.log(`${applyChanges ? 'freed' : 'reclaimable'} total: ${formatBytes(totalBytes)}`)
