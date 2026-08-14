const { Router } = require('express')
const multer = require('multer')
const path = require('path')
const controller = require('../controllers/note-controller')
const auth = require('../middleware/auth')
const config = require('../config')

const upload = multer({ dest: path.join(config.uploadDir, 'notes'), limits: { fileSize: 1024 * 1024 } })

// 公开路由
const publicRouter = Router()
publicRouter.get('/', controller.listPublic)

// 管理路由
const adminRouter = Router()
adminRouter.use(auth)
adminRouter.get('/', controller.list)
adminRouter.get('/:id', controller.getById)
adminRouter.post('/', upload.single('file'), controller.create)
adminRouter.put('/:id', controller.update)
adminRouter.delete('/:id', controller.remove)
adminRouter.get('/:id/export', controller.exportNote)

module.exports = { publicRouter, adminRouter }
