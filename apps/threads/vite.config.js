import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootAssetsDir = path.resolve(__dirname, '../../assets')

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webm': 'video/webm',
  '.webp': 'image/webp'
}

function createRootAssetsMiddleware() {
  return (req, res, next) => {
    const requestPath = req.url ? req.url.split('?')[0] : ''

    if (!requestPath.startsWith('/assets/')) {
      next()
      return
    }

    const relativeAssetPath = decodeURIComponent(requestPath.slice('/assets/'.length))
    const assetPath = path.resolve(rootAssetsDir, relativeAssetPath)
    const allowedPrefix = `${rootAssetsDir}${path.sep}`

    if (assetPath !== rootAssetsDir && !assetPath.startsWith(allowedPrefix)) {
      res.statusCode = 403
      res.end('Forbidden')
      return
    }

    fs.stat(assetPath, (error, stats) => {
      if (error || !stats.isFile()) {
        next()
        return
      }

      const contentType = mimeTypes[path.extname(assetPath).toLowerCase()] || 'application/octet-stream'
      res.setHeader('Content-Type', contentType)
      fs.createReadStream(assetPath).pipe(res)
    })
  }
}

function serveRootAssetsPlugin() {
  const middleware = createRootAssetsMiddleware()

  return {
    name: 'threads-serve-root-assets',
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveRootAssetsPlugin()],
  publicDir: false,
  server: {
    watch: {
      ignored: ['**/public/**', '**/tests/**']
    }
  },
  optimizeDeps: {
    include: ['lucide-react']
  }
})
