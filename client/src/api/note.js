import { loadJson } from './loader'

let notesPromise = null
const notes = () => (notesPromise ??= loadJson('/data/notes.json'))

async function list(params = {}) {
  const all = await notes()
  const { page = 1, limit = 20, category } = params
  let list = all
  if (category) list = list.filter(n => n.category?.slug === category)
  const total = list.length
  const safePage = Math.max(+page || 1, 1)
  const safeLimit = Math.min(Math.max(+limit || 20, 1), 100)
  const start = (safePage - 1) * safeLimit
  return {
    data: {
      data: list.slice(start, start + safeLimit),
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    },
  }
}

export const getNotes = list
export const getPublicNotes = list
