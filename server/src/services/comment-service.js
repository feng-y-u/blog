const prisma = require('../utils/prisma')
const { COMMENT_STATUS } = require('../constants')

// Comments are stored raw: React escapes text at render time (no dangerouslySetInnerHTML
// is used anywhere in the client). Do NOT reintroduce server-side HTML escaping here,
// it causes double-escaped output (e.g. "&lt;" shown literally).

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
  if (parentId && parent.parentId !== null) {
    // Only one reply level is supported; nested replies would never be displayed.
    throw Object.assign(new Error('暂不支持回复的回复'), { statusCode: 400 })
  }

  return prisma.comment.create({
    data: {
      postId,
      authorName,
      authorEmail,
      content,
      parentId: parentId ? +parentId : null,
      status: COMMENT_STATUS.PENDING,
    },
  })
}

async function listAll({ page = 1, limit = 20, status } = {}) {
  page = Math.max(+page || 1, 1); limit = Math.min(Math.max(+limit || 20, 1), 100)
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

  // Collect and delete all descendants: the self-relation has no DB-level cascade.
  const ids = [id]
  let frontier = [id]
  while (frontier.length) {
    const children = await prisma.comment.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    })
    frontier = children.map(c => c.id)
    ids.push(...frontier)
  }
  await prisma.comment.deleteMany({ where: { id: { in: ids } } })
  return true
}

module.exports = { listByPost, create, listAll, update, remove }
