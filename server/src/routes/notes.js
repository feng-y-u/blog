const { Router } = require('express')
const multer = require('multer')
const os = require('os')
const path = require('path')
const controller = require('../controllers/note-controller')
const auth = require('../middleware/auth')

// Temp dir outside the public /uploads tree; files are deleted right after import.
const upload = multer({ dest: path.join(os.tmpdir(), 'blog-note-uploads'), limits: { fileSize: 1024 * 1024 } })

// 公开路由
const publicRouter = Router()
publicRouter.get('/', controller.list)

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
