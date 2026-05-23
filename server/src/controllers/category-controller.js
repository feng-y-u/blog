const categoryService = require('../services/category-service')

async function list(req, res, next) {
  try {
    const data = await categoryService.list()
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

async function getBySlug(req, res, next) {
  try {
    const category = await categoryService.getBySlug(req.params.slug)
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

    const category = await categoryService.create({ name, description })
    res.status(201).json({ data: category })
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name, description } = req.body
    const category = await categoryService.update(id, { name, description })
    if (!category) return res.status(404).json({ error: '分类不存在' })

    res.json({ data: category })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await categoryService.remove(id)
    if (!ok) return res.status(404).json({ error: '分类不存在' })

    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug, create, update, remove }
