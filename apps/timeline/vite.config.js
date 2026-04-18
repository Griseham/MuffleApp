import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export default defineConfig(({ command }) => {
  // Built assets are served by the unified Express app under /timeline in production.
  const defaultBasePath = command === 'build' ? '/timeline/' : '/'
  const rawBasePath = process.env.VITE_BASE_PATH || defaultBasePath
  const basePath = rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`

  return {
    base: basePath,
    plugins: [
      react(),
      {
        name: 'serve-root-assets',
        configureServer(server) {
          const assetsDir = path.resolve(__dirname, '../../assets')
          server.middlewares.use('/assets', (req, res, next) => {
            const resolved = path.resolve(assetsDir, '.' + decodeURIComponent(req.url.split('?')[0]))
            if (!resolved.startsWith(assetsDir + path.sep) && resolved !== assetsDir) {
              res.statusCode = 403
              res.end('Forbidden')
              return
            }
            if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
              res.setHeader('Cache-Control', 'no-cache')
              fs.createReadStream(resolved).pipe(res)
            } else {
              next()
            }
          })
        },
      },
    ],
    esbuild: {
      drop: ['console', 'debugger'],
    },
    server: {
      port: 5174,
    },
  }
})
