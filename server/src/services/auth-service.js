const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const config = require('../config')

async function login(username, password) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  return {
    token,
    user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar },
  }
}

async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatar: true, bio: true, email: true },
  })
}

module.exports = { login, getMe }
