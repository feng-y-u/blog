const { Router } = require('express')
const controller = require('../controllers/comment-controller')
const auth = require('../middleware/auth')

const postCommentsRouter = Router()
postCommentsRouter.get('/:postId/comments', controller.listByPost)
postCommentsRouter.post('/:postId/comments', controller.create)

const adminCommentsRouter = Router()
adminCommentsRouter.get('/', auth, controller.listAll)
adminCommentsRouter.put('/:id', auth, controller.update)
adminCommentsRouter.delete('/:id', auth, controller.remove)

module.exports = { postCommentsRouter, adminCommentsRouter }
