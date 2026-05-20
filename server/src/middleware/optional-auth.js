const jwt = require('jsonwebtoken')
const config = require('../config')

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return next()

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, config.jwtSecret)
  } catch { /* eslint no-empty */ }
  next()
}

module.exports = optionalAuth
