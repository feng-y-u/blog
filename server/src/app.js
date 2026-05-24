const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const config = require('./config')
const errorHandler = require('./middleware/error')

const app = express()

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://flowyu.xyz', 'https://www.flowyu.xyz', 'https://blog.flowyu.xyz']
  : ['http://localhost:5173']

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  },
}))
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const categoryRoutes = require('./routes/categories')
const tagRoutes = require('./routes/tags')
const { postCommentsRouter, adminCommentsRouter } = require('./routes/comments')
const { publicRouter: notePublicRouter, adminRouter: noteAdminRouter } = require('./routes/notes')
const auth = require('./middleware/auth')
const upload = require('./middleware/upload')
const { uploadImage } = require('./controllers/upload-controller')
const settingsRoutes = require('./routes/settings')
const { sitemap, robots } = require('./controllers/sitemap-controller')

app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts', postCommentsRouter)
app.use('/api/comments', adminCommentsRouter)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/notes/public', notePublicRouter)
app.use('/api/notes', noteAdminRouter)
app.use('/api/settings', settingsRoutes)
app.post('/api/upload', auth, upload.single('image'), uploadImage)
app.get('/api/sitemap', sitemap)
app.get('/robots.txt', robots)

if (process.env.NODE_ENV === 'production') {
  const clientDist = process.env.CLIENT_DIST_DIR || path.join(__dirname, '../../client/dist')
  const indexPath = path.join(clientDist, 'index.html')
  app.use(express.static(clientDist, {
    maxAge: '1y',
    immutable: true,
    dotfiles: 'deny',
    index: false,
  }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(indexPath, err => { if (err) next(err) })
  })
}

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})

module.exports = app
