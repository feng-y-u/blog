const router = require('express').Router()
const controller = require('../controllers/settings-controller')
const auth = require('../middleware/auth')

router.get('/', controller.getAll)
router.put('/', auth, controller.update)

module.exports = router
