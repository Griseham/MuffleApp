import { spawn } from 'node:child_process'
import path from 'node:path'

const rootDir = process.cwd()
const threadsDir = path.join(rootDir, 'apps', 'threads')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const children = new Set()
let shuttingDown = false

function prefixOutput(stream, label, colorCode) {
  let buffer = ''

  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const prefix = `\u001b[${colorCode}m[${label}]\u001b[0m`
      process.stdout.write(`${prefix} ${line}\n`)
    }
  })

  stream.on('end', () => {
    if (!buffer) return
    const prefix = `\u001b[${colorCode}m[${label}]\u001b[0m`
    process.stdout.write(`${prefix} ${buffer}\n`)
  })
}

function spawnProcess(label, colorCode, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe']
  })

  children.add(child)
  prefixOutput(child.stdout, label, colorCode)
  prefixOutput(child.stderr, label, colorCode)

  child.on('exit', (code, signal) => {
    children.delete(child)

    if (shuttingDown) {
      return
    }

    if (signal) {
      console.error(`[${label}] exited from signal ${signal}`)
      shutdown(1)
      return
    }

    if (code !== 0) {
      console.error(`[${label}] exited with code ${code}`)
      shutdown(code || 1)
    }
  })

  child.on('error', (error) => {
    console.error(`[${label}] ${error.message}`)
    shutdown(1)
  })

  return child
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    child.kill('SIGTERM')
  }

  setTimeout(() => {
    for (const child of children) {
      child.kill('SIGKILL')
    }
    process.exit(exitCode)
  }, 1200).unref()

  setTimeout(() => process.exit(exitCode), 200).unref()
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

spawnProcess('api', '36', process.execPath, ['server.js'], rootDir)
spawnProcess('threads', '35', npmCommand, ['run', 'dev'], threadsDir)
