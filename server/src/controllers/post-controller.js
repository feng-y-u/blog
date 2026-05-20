const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list(req, res, next) {
  try {
    let { page = 1, limit = 10, category, tag, status, search } = req.query
    page = +page; limit = +limit
    const where = {}

    if (category) where.category = { slug: category }
    if (tag) where.tags = { some: { tag: { slug: tag } } }
    if (status) where.status = status
    else if (!req.user) where.status = 'published'
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

    res.json({
      data: data.map(p => ({ ...p, tags: p.tags.map(pt => pt.tag) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

async function getBySlug(req, res, next) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        author: { select: { id: true, displayName: true, avatar: true } },
      },
    })
    if (!post || (post.status !== 'published' && !req.user)) {
      return res.status(404).json({ error: '文章不存在' })
    }

    await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })

    res.json({ data: { ...post, tags: post.tags.map(pt => pt.tag) } })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { title, content, excerpt, coverImage, status, categoryId, tagIds } = req.body
    if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' })

    const slug = await uniqueSlug(prisma, 'post', title)

    const post = await prisma.post.create({
      data: {
        title, slug, content, excerpt, coverImage,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        categoryId: categoryId || null,
        authorId: req.user.sub,
        tags: tagIds?.length ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
      },
      include: { category: true, tags: { include: { tag: true } } },
    })

    res.status(201).json({ data: { ...post, tags: post.tags.map(pt => pt.tag) } })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { title, content, excerpt, coverImage, status, categoryId, tagIds } = req.body
    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '文章不存在' })

    const data = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (excerpt !== undefined) data.excerpt = excerpt
    if (coverImage !== undefined) data.coverImage = coverImage
    if (status !== undefined) {
      data.status = status
      if (status === 'published' && !existing.publishedAt) data.publishedAt = new Date()
    }
    if (categoryId !== undefined) data.categoryId = categoryId || null

    if (tagIds !== undefined) {
      await prisma.postTag.deleteMany({ where: { postId: id } })
      if (tagIds.length) {
        await prisma.postTag.createMany({ data: tagIds.map(tagId => ({ postId: id, tagId })) })
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data,
      include: { category: true, tags: { include: { tag: true } } },
    })

    res.json({ data: { ...post, tags: post.tags.map(pt => pt.tag) } })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '文章不存在' })

    await prisma.postTag.deleteMany({ where: { postId: id } })
    await prisma.comment.deleteMany({ where: { postId: id } })
    await prisma.post.delete({ where: { id } })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = +req.params.id
    const { status } = req.body
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' })
    }

    const data = { status }
    if (status === 'published') data.publishedAt = new Date()

    const post = await prisma.post.update({
      where: { id },
      data,
      include: { category: true, tags: { include: { tag: true } } },
    })

    res.json({ data: { ...post, tags: post.tags.map(pt => pt.tag) } })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug, create, update, remove, updateStatus }
