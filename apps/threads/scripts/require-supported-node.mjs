import { accessSync, constants } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const minimum = { major: 22, minor: 13, patch: 1 }

function parseVersion(versionText) {
  const [major = '0', minor = '0', patch = '0'] = String(versionText || '').split('.')
  return {
    major: Number.parseInt(major, 10) || 0,
    minor: Number.parseInt(minor, 10) || 0,
    patch: Number.parseInt(patch, 10) || 0
  }
}

function isSupported(version, floor) {
  if (version.major !== floor.major) return version.major > floor.major
  if (version.minor !== floor.minor) return version.minor > floor.minor
  return version.patch >= floor.patch
}

function buildErrorMessage() {
  return [
    `Threads requires Node ${minimum.major}.${minimum.minor}.${minimum.patch} or newer.`,
    `Current runtime: ${process.versions.node}.`,
    'Use `nvm use` in the repo before running dev/build/lint commands.'
  ].join(' ')
}

function findAlternativeNodeBinary() {
  const candidates = []

  if (process.env.NVM_BIN) {
    candidates.push(path.join(process.env.NVM_BIN, 'node'))
  }

  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK)
      const version = parseVersion(
        process.env.NVM_BIN
          ? path.basename(path.dirname(process.env.NVM_BIN)).replace(/^v/, '')
          : ''
      )
      if (isSupported(version, minimum)) {
        return candidate
      }
    } catch {
      // Ignore invalid candidates and keep looking.
    }
  }

  return null
}

const current = parseVersion(process.versions.node)
const targetArgs = process.argv.slice(2)

if (isSupported(current, minimum)) {
  if (targetArgs.length === 0) {
    process.exit(0)
  }

  const child = spawn(process.execPath, targetArgs, {
    stdio: 'inherit',
    env: process.env
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error(error.message)
    process.exit(1)
  })
} else {
  const alternativeNode = findAlternativeNodeBinary()

  if (!alternativeNode) {
    console.error(buildErrorMessage())
    process.exit(1)
  }

  if (targetArgs.length === 0) {
    console.error(buildErrorMessage())
    process.exit(1)
  }

  const child = spawn(alternativeNode, targetArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${path.dirname(alternativeNode)}${path.delimiter}${process.env.PATH || ''}`
    }
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }
    process.exit(code ?? 0)
  })

  child.on('error', (error) => {
    console.error(error.message)
    process.exit(1)
  })
}
