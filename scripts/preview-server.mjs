/**
 * Minimal static file server for serving dist/ inside environments
 * where long-running dev-server processes are hard to keep alive.
 * Usage: node scripts/preview-server.mjs [port]
 */
import http from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
)
const port = Number(process.argv[2]) || 61834

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost')
      let filePath = path.join(root, decodeURIComponent(url.pathname))
      if (!filePath.startsWith(root)) {
        res.writeHead(403).end('Forbidden')
        return
      }
      let stat = await fs.stat(filePath).catch(() => null)
      if (stat?.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
        stat = await fs.stat(filePath).catch(() => null)
      }
      if (!stat) {
        // SPA fallback to index.html
        filePath = path.join(root, 'index.html')
      }
      const body = await fs.readFile(filePath)
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      })
      res.end(body)
    } catch (err) {
      res.writeHead(500).end(String(err))
    }
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`preview server listening on http://127.0.0.1:${port}`)
  })
