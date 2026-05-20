const path = require('path')

async function uploadImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: '未选择文件' })
    const segments = req.file.path.split(path.sep).slice(-2)
    const url = `/uploads/images/${segments.join('/')}`
    res.json({ data: { url, filename: req.file.filename } })
  } catch (err) {
    next(err)
  }
}

module.exports = { uploadImage }
