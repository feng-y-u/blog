const prisma = require('../utils/prisma')

function toObject(rows) {
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
}

exports.getAll = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany()
    res.json({ data: toObject(settings) })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const entries = req.body
    const ops = Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
    await prisma.$transaction(ops)
    const settings = await prisma.setting.findMany()
    res.json({ data: toObject(settings) })
  } catch (err) {
    next(err)
  }
}
