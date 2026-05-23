const authService = require('../services/auth-service')

async function login(req, res, next) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const result = await authService.login(username, password)
    if (!result) return res.status(401).json({ error: '用户名或密码错误' })

    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub)
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

module.exports = { login, getMe }
