const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list() {
  return prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })
}

async function create({ name }) {
  const slug = await uniqueSlug(prisma, 'tag', name)
  return prisma.tag.create({ data: { name, slug } })
}

async function update(id, { name }) {
  const existing = await prisma.tag.findUnique({ where: { id } })
  if (!existing) return null
  return prisma.tag.update({ where: { id }, data: { name } })
}

async function remove(id) {
  const existing = await prisma.tag.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { tagId: id } }),
    prisma.tag.delete({ where: { id } }),
  ])
  return true
}

module.exports = { list, create, update, remove }
