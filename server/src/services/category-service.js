const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list() {
  return prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })
}

async function getBySlug(slug) {
  return prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  })
}

async function create({ name, description }) {
  const slug = await uniqueSlug(prisma, 'category', name)
  return prisma.category.create({ data: { name, slug, description } })
}

async function update(id, { name, description }) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return null
  const data = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  return prisma.category.update({ where: { id }, data })
}

async function remove(id) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.note.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.category.delete({ where: { id } })
  return true
}

module.exports = { list, getBySlug, create, update, remove }
