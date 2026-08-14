const noteService = require('../services/note-service')

async function list(req, res, next) {
  try {
    const result = await noteService.list(req.query)
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

async function getById(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.getById(id)
    if (!note) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: note })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const note = await noteService.create({ ...req.body, file: req.file })
    res.status(201).json({ data: note })
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.update(id, req.body)
    if (!note) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: note })
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await noteService.remove(id)
    if (!ok) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: { id } })
  } catch (err) {
    next(err)
  }
}

async function exportNote(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.getForExport(id)
    if (!note) return res.status(404).json({ error: '笔记不存在' })

    const filename = encodeURIComponent(note.title.replace(/[/\\?%*:|"<>]/g, '_')) + '.md'
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.send(note.content)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getById, create, update, remove, exportNote }
