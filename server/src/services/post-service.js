const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')
const { POST_STATUS } = require('../constants')

function reshapeTags(post) {
  return { ...post, tags: (post.tags || []).map(pt => pt.tag) }
}

async function list({ page = 1, limit = 10, category, tag, status, search, user } = {}) {
  page = +page; limit = Math.min(+limit, 100)
  const where = {}

  if (category) where.category = { slug: category }
  if (tag) where.tags = { some: { tag: { slug: tag } } }
  if (status) where.status = status
  else if (!user) where.status = POST_STATUS.PUBLISHED
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.post.count({ where }),
  ])

  return { data: data.map(reshapeTags), total, page, limit }
}

async function getBySlug(slug, user) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  })
  if (!post || (post.status !== POST_STATUS.PUBLISHED && !user)) return null

  await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
  return reshapeTags(post)
}

async function getById(id) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  })
  return post ? reshapeTags(post) : null
}

async function create(data) {
  const { title, content, excerpt, coverImage, jpChar, status, categoryId, tagIds, authorId } = data
  const slug = await uniqueSlug(prisma, 'post', title)

  const post = await prisma.post.create({
    data: {
      title, slug, content, excerpt, coverImage, jpChar,
      status: status || POST_STATUS.DRAFT,
      publishedAt: status === POST_STATUS.PUBLISHED ? new Date() : null,
      categoryId: categoryId || null,
      authorId,
      tags: tagIds?.length ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
    },
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function update(id, data) {
  const { title, content, excerpt, coverImage, jpChar, status, categoryId, tagIds } = data
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null

  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (excerpt !== undefined) updateData.excerpt = excerpt
  if (coverImage !== undefined) updateData.coverImage = coverImage
  if (jpChar !== undefined) updateData.jpChar = jpChar || null
  if (status !== undefined) {
    updateData.status = status
    if (status === POST_STATUS.PUBLISHED && !existing.publishedAt) updateData.publishedAt = new Date()
  }
  if (categoryId !== undefined) updateData.categoryId = categoryId || null

  if (tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } })
    if (tagIds.length) {
      await prisma.postTag.createMany({ data: tagIds.map(tagId => ({ postId: id, tagId })) })
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function remove(id) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.post.delete({ where: { id } })
  return true
}

async function updateStatus(id, status) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null

  const data = { status }
  if (status === POST_STATUS.PUBLISHED) data.publishedAt = new Date()

  const post = await prisma.post.update({
    where: { id },
    data,
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function getAdjacentPosts(id) {
  const [prev, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { id: { lt: id }, status: POST_STATUS.PUBLISHED },
      orderBy: { id: 'desc' },
      select: { id: true, title: true, slug: true },
    }),
    prisma.post.findFirst({
      where: { id: { gt: id }, status: POST_STATUS.PUBLISHED },
      orderBy: { id: 'asc' },
      select: { id: true, title: true, slug: true },
    }),
  ])
  return { prev, next: nextPost }
}

module.exports = { list, getBySlug, getById, create, update, remove, updateStatus, getAdjacentPosts }
