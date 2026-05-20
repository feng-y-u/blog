const router = require('express').Router()
const controller = require('../controllers/category-controller')
const auth = require('../middleware/auth')

router.get('/', controller.list)
router.get('/:slug', controller.getBySlug)
router.post('/', auth, controller.create)
router.put('/:id', auth, controller.update)
router.delete('/:id', auth, controller.remove)

module.exports = router
