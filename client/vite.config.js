import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const contentImagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content/images')

const IMAGE_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
}

// Dev-only: the /writer tool writes images into content/images, but public/images
// only receives copies at build time. Serve /images directly from content/images
// first so freshly inserted images show up in the preview immediately.
function contentImagesDev() {
  return {
    name: 'content-images-dev',
    configureServer(server) {
      server.middlewares.use('/images', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\/+/, '')
        if (!rel || rel.includes('..')) return next()
        const file = path.join(contentImagesDir, rel)
        if (!file.startsWith(contentImagesDir)) return next()
        fs.readFile(file, (err, data) => {
          if (err) return next()
          res.setHeader('Content-Type', IMAGE_MIME[path.extname(file).toLowerCase()] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(data)
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), contentImagesDev()],
  server: {
    port: 5173,
  },
})
