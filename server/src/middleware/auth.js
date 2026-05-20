const jwt = require('jsonwebtoken')
const config = require('../config')

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: '认证令牌无效或已过期' })
  }
}

module.exports = auth
