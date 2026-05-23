const prisma = require('../utils/prisma')

function toObject(rows) {
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
}

async function getAll() {
  const settings = await prisma.setting.findMany()
  return toObject(settings)
}

async function update(entries) {
  const ops = Object.entries(entries).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  )
  await prisma.$transaction(ops)
  const settings = await prisma.setting.findMany()
  return toObject(settings)
}

module.exports = { getAll, update }
