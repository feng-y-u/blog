// Loads static JSON from /data/* with promise caching (each path fetched once).
const cache = new Map()

export function loadJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then(res => {
      if (!res.ok) throw new Error(`加载 ${path} 失败: ${res.status}`)
      return res.json()
    }))
  }
  return cache.get(path)
}
