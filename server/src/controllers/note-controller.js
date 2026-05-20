const prisma = require('../utils/prisma')

async function listPublic(req, res, next) {
  try {
    let { page = 1, limit = 20 } = req.query
    page = +page; limit = Math.min(+limit, 100)

    const [data, total] = await Promise.all([
      prisma.note.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, title: true, categoryId: true, category: { select: { id: true, name: true, slug: true } }, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.note.count(),
    ])

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

async function list(req, res, next) {
  try {
    let { page = 1, limit = 20, categoryId } = req.query
    page = +page; limit = Math.min(+limit, 100)
    const where = {}
    if (categoryId) where.categoryId = +categoryId

    const [data, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.note.count({ where }),
    ])

    res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const id = +req.params.id
    const note = await prisma.note.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })
    if (!note) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: note })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    let title, content, categoryId

    if (req.file) {
      title = req.file.originalname.replace(/\.md$/i, '')
      content = require('fs').readFileSync(req.file.path, 'utf-8')
      categoryId = req.body.categoryId ? +req.body.categoryId : null
    } else {
      title = req.body.title
      content = req.body.content
      categoryId = req.body.categoryId ? +req.body.categoryId : null
    }

    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' })
    }

    const note = await prisma.note.create({
      data: { title, content, categoryId, filePath: req.file?.path },
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    res.status(201).json({ data: note })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { title, content, categoryId } = req.body
    const existing = await prisma.note.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '笔记不存在' })

    const data = {}
    if (title !== undefined) data.title = title
    if (content !== undefined) data.content = content
    if (categoryId !== undefined) data.categoryId = categoryId || null

    const note = await prisma.note.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    res.json({ data: note })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    await prisma.note.delete({ where: { id } })
    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

async function exportNote(req, res, next) {
  try {
    const id = +req.params.id
    const note = await prisma.note.findUnique({ where: { id } })
    if (!note) return res.status(404).json({ error: '笔记不存在' })

    const filename = encodeURIComponent(note.title.replace(/[/\\?%*:|"<>]/g, '_')) + '.md'
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.send(note.content)
  } catch (err) {
    next(err)
  }
}

module.exports = { listPublic, list, getById, create, update, remove, exportNote }
