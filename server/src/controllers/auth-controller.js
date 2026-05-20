const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const config = require('../config')

async function login(req, res, next) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    )

    res.json({
      data: {
        token,
        user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar },
      },
    })
  } catch (err) {
    next(err)
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true, displayName: true, avatar: true, bio: true, email: true },
    })
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

module.exports = { login, getMe }
