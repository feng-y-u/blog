import { loadJson } from './loader'

let tagsPromise = null
const tags = () => (tagsPromise ??= loadJson('/data/tags.json'))

export async function getTags() {
  return { data: { data: await tags() } }
}
