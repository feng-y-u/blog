export function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

export function formatTime(date) {
  const d = new Date(date)
  const diff = Date.now() - d
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}
