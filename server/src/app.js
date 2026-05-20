const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const config = require('./config')
const errorHandler = require('./middleware/error')

const app = express()

app.use(cors())
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
const { rss } = require('./controllers/feed-controller')

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts', postCommentsRouter)
app.use('/api/comments', adminCommentsRouter)
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/notes/public', notePublicRouter)
app.use('/api/notes', noteAdminRouter)
app.get('/api/feed', rss)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})

module.exports = app
