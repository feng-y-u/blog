import { loadJson } from './loader'

let postsPromise = null
const posts = () => (postsPromise ??= loadJson('/data/posts.json'))

// Keep the legacy response shape { data: { data, pagination } } so pages stay unchanged.
export async function getPosts(params = {}) {
  const all = await posts()
  const { page = 1, limit = 3, category, tag, search } = params
  let list = all
  if (category) list = list.filter(p => p.category?.slug === category)
  if (tag) list = list.filter(p => p.tags?.some(t => t.slug === tag))
  if (search) {
    const q = String(search).toLowerCase()
    list = list.filter(p => p.title?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q))
  }
  const total = list.length
  const safePage = Math.max(+page || 1, 1)
  const safeLimit = Math.min(Math.max(+limit || 3, 1), 100)
  const start = (safePage - 1) * safeLimit
  return {
    data: {
      data: list.slice(start, start + safeLimit),
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    },
  }
}

export async function getPostBySlug(slug) {
  const all = await posts()
  const post = all.find(p => p.slug === slug) || null
  return { data: { data: post } }
}
