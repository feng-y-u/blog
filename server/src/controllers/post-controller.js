const postService = require('../services/post-service')

async function list(req, res, next) {
  try {
    const result = await postService.list({ ...req.query, user: req.user })
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

async function getBySlug(req, res, next) {
  try {
    const post = await postService.getBySlug(req.params.slug, req.user)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { title, content, excerpt, coverImage, jpChar, status, categoryId, tagIds } = req.body
    if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' })

    const post = await postService.create({
      title, content, excerpt, coverImage, jpChar, status, categoryId, tagIds,
      authorId: req.user.sub,
    })
    res.status(201).json({ data: post })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const post = await postService.update(id, req.body)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await postService.remove(id)
    if (!ok) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = +req.params.id
    const { status } = req.body
    const post = await postService.updateStatus(id, status)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const id = +req.params.id
    const post = await postService.getById(id, req.user)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) {
    next(err)
  }
}

async function getAdjacentPosts(req, res, next) {
  try {
    const id = +req.params.id
    const result = await postService.getAdjacentPosts(id)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug, getById, create, update, remove, updateStatus, getAdjacentPosts }
