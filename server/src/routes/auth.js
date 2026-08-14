const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const controller = require('../controllers/auth-controller')
const auth = require('../middleware/auth')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '登录尝试过于频繁，请15分钟后再试' },
})

router.post('/login', loginLimiter, controller.login)
router.get('/me', auth, controller.getMe)

module.exports = router
