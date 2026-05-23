const prisma = require('../utils/prisma')
const fs = require('fs/promises')

async function listPublic(params = {}) {
  return list(params)
}

async function list({ page = 1, limit = 20, categoryId } = {}) {
  page = +page; limit = Math.min(+limit, 100)
  const where = {}
  if (categoryId) where.categoryId = +categoryId

  const [data, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.note.count({ where }),
  ])

  return { data, total, page, limit }
}

async function getById(id) {
  return prisma.note.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function create(data) {
  let title, content, categoryId

  if (data.file) {
    title = data.file.originalname.replace(/\.md$/i, '')
    content = await fs.readFile(data.file.path, 'utf-8')
    categoryId = data.categoryId ? +data.categoryId : null
  } else {
    title = data.title
    content = data.content
    categoryId = data.categoryId ? +data.categoryId : null
  }

  if (!title || !content) {
    throw Object.assign(new Error('标题和内容不能为空'), { statusCode: 400 })
  }

  return prisma.note.create({
    data: { title, content, categoryId, filePath: data.file?.path },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function update(id, { title, content, categoryId }) {
  const existing = await prisma.note.findUnique({ where: { id } })
  if (!existing) return null

  const data = {}
  if (title !== undefined) data.title = title
  if (content !== undefined) data.content = content
  if (categoryId !== undefined) data.categoryId = categoryId || null

  return prisma.note.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function remove(id) {
  const existing = await prisma.note.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.note.delete({ where: { id } })
  return true
}

async function getForExport(id) {
  return prisma.note.findUnique({ where: { id } })
}

module.exports = { listPublic, list, getById, create, update, remove, getForExport }
