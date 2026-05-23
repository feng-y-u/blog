const settingsService = require('../services/settings-service')

exports.getAll = async (req, res, next) => {
  try {
    const data = await settingsService.getAll()
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

exports.update = async (req, res, next) => {
  try {
    const data = await settingsService.update(req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}
