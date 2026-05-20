const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list(req, res, next) {
  try {
    const data = await prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

async function getBySlug(req, res, next) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { posts: true } } },
    })
    if (!category) return res.status(404).json({ error: '分类不存在' })
    res.json({ data: category })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: '分类名称不能为空' })

    const slug = await uniqueSlug(prisma, 'category', name)
    const category = await prisma.category.create({ data: { name, slug, description } })
    res.status(201).json({ data: category })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name, description } = req.body
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '分类不存在' })

    const data = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description

    const category = await prisma.category.update({ where: { id }, data })
    res.json({ data: category })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '分类不存在' })

    await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await prisma.note.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
    await prisma.category.delete({ where: { id } })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug, create, update, remove }
