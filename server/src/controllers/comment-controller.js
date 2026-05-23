const prisma = require('../utils/prisma')

async function listByPost(req, res, next) {
  try {
    const postId = +req.params.postId
    const comments = await prisma.comment.findMany({
      where: { postId, status: 'approved', parentId: null },
      include: {
        replies: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ data: comments })
  } catch (err) {
    next(err)
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function create(req, res, next) {
  try {
    const postId = +req.params.postId
    const { authorName, authorEmail, content, parentId } = req.body

    if (!authorName || !content) {
      return res.status(400).json({ error: '昵称和内容不能为空' })
    }

    const checks = [prisma.post.findUnique({ where: { id: postId } })]
    if (parentId) checks.push(prisma.comment.findUnique({ where: { id: +parentId } }))
    const [post, parent] = await Promise.all(checks)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    if (parentId && (!parent || parent.postId !== postId)) {
      return res.status(400).json({ error: '父评论不存在' })
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorName: escapeHtml(authorName),
        authorEmail,
        content: escapeHtml(content),
        parentId: parentId ? +parentId : null,
        status: 'pending',
      },
    })

    res.status(201).json({ data: comment })
  } catch (err) {
    next(err)
  }
}

async function listAll(req, res, next) {
  try {
    let { page = 1, limit = 20, status } = req.query
    page = +page; limit = Math.min(+limit, 100)
    const where = {}
    if (status) where.status = status

    const [data, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { post: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where }),
    ])

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { status, content } = req.body
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return res.status(404).json({ error: '评论不存在' })

    const data = {}
    if (status) data.status = status
    if (content !== undefined) data.content = content

    const updated = await prisma.comment.update({ where: { id }, data })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    // 级联删除回复
    await prisma.comment.deleteMany({ where: { parentId: id } })
    await prisma.comment.delete({ where: { id } })
    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { listByPost, create, listAll, update, remove }
