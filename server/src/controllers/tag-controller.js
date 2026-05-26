const tagService = require('../services/tag-service')

async function list(req, res, next) {
  try {
    const data = await tagService.list()
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: '标签名称不能为空' })

    const tag = await tagService.create({ name })
    res.status(201).json({ data: tag })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name } = req.body
    const tag = await tagService.update(id, { name })
    if (!tag) return res.status(404).json({ error: '标签不存在' })

    res.json({ data: tag })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await tagService.remove(id)
    if (!ok) return res.status(404).json({ error: '标签不存在' })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove }
