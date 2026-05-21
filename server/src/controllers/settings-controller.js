const prisma = require('../utils/prisma')

exports.getAll = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany()
    const result = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const entries = req.body
    for (const [key, value] of Object.entries(entries)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    const settings = await prisma.setting.findMany()
    const result = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}
