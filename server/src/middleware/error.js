function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message)

  if (err.code === 'P2025') {
    return res.status(404).json({ error: '资源不存在' })
  }

  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  })
}

module.exports = errorHandler
