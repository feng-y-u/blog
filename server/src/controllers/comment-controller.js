const commentService = require('../services/comment-service')

async function listByPost(req, res, next) {
  try {
    const postId = +req.params.postId
    const data = await commentService.listByPost(postId)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const postId = +req.params.postId
    const { authorName, authorEmail, content, parentId } = req.body

    if (!authorName || !content) {
      return res.status(400).json({ error: '昵称和内容不能为空' })
    }

    const comment = await commentService.create(postId, { authorName, authorEmail, content, parentId })
    res.status(201).json({ data: comment })
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    next(err)
  }
}

async function listAll(req, res, next) {
  try {
    const result = await commentService.listAll(req.query)
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const comment = await commentService.update(id, req.body)
    if (!comment) return res.status(404).json({ error: '评论不存在' })

    res.json({ data: comment })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await commentService.remove(id)
    if (!ok) return res.status(404).json({ error: '评论不存在' })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { listByPost, create, listAll, update, remove }
