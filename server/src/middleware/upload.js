const multer = require('multer')
const path = require('path')
const fs = require('fs')
const config = require('../config')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date()
    const dateDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
    const dir = path.join(config.uploadDir, 'images', dateDir)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const extOk = allowedExts.includes(path.extname(file.originalname).toLowerCase())
    const mimeOk = allowedMimes.includes(file.mimetype)
    cb(null, extOk && mimeOk)
  },
})

module.exports = upload
