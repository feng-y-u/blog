const prisma = require('../utils/prisma')
const { COMMENT_STATUS } = require('../constants')

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function listByPost(postId) {
  return prisma.comment.findMany({
    where: { postId, status: COMMENT_STATUS.APPROVED, parentId: null },
    include: {
      replies: {
        where: { status: COMMENT_STATUS.APPROVED },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

async function create(postId, { authorName, authorEmail, content, parentId }) {
  const checks = [prisma.post.findUnique({ where: { id: postId } })]
  if (parentId) checks.push(prisma.comment.findUnique({ where: { id: +parentId } }))
  const [post, parent] = await Promise.all(checks)

  if (!post) throw Object.assign(new Error('文章不存在'), { statusCode: 404 })
  if (parentId && (!parent || parent.postId !== postId)) {
    throw Object.assign(new Error('父评论不存在'), { statusCode: 400 })
  }

  return prisma.comment.create({
    data: {
      postId,
      authorName: escapeHtml(authorName),
      authorEmail,
      content: escapeHtml(content),
      parentId: parentId ? +parentId : null,
      status: COMMENT_STATUS.PENDING,
    },
  })
}

async function listAll({ page = 1, limit = 20, status } = {}) {
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

  return { data, total, page, limit }
}

async function update(id, { status, content }) {
  const existing = await prisma.comment.findUnique({ where: { id } })
  if (!existing) return null

  const data = {}
  if (status) data.status = status
  if (content !== undefined) data.content = content

  return prisma.comment.update({ where: { id }, data })
}

async function remove(id) {
  const existing = await prisma.comment.findUnique({ where: { id } })
  if (!existing) return null

  await prisma.comment.deleteMany({ where: { parentId: id } })
  await prisma.comment.delete({ where: { id } })
  return true
}

module.exports = { listByPost, create, listAll, update, remove }
