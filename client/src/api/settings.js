import { loadJson } from './loader'

let settingsPromise = null
const settings = () => (settingsPromise ??= loadJson('/data/settings.json'))

export async function getSettings() {
  return { data: { data: await settings() } }
}
