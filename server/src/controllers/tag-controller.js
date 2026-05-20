const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list(req, res, next) {
  try {
    const data = await prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: '标签名称不能为空' })

    const slug = await uniqueSlug(prisma, 'tag', name)
    const tag = await prisma.tag.create({ data: { name, slug } })
    res.status(201).json({ data: tag })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name } = req.body
    const existing = await prisma.tag.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '标签不存在' })

    const tag = await prisma.tag.update({ where: { id }, data: { name } })
    res.json({ data: tag })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const existing = await prisma.tag.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: '标签不存在' })

    await prisma.postTag.deleteMany({ where: { tagId: id } })
    await prisma.tag.delete({ where: { id } })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }
