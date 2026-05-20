const router = require('express').Router()
const controller = require('../controllers/auth-controller')

router.post('/login', controller.login)
router.get('/me', controller.getMe)

module.exports = router
