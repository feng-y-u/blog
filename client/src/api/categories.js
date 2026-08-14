import { loadJson } from './loader'

let categoriesPromise = null
const categories = () => (categoriesPromise ??= loadJson('/data/categories.json'))

export async function getCategories() {
  return { data: { data: await categories() } }
}

export async function getCategoryBySlug(slug) {
  const all = await categories()
  return { data: { data: all.find(c => c.slug === slug) || null } }
}
