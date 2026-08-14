import { loadJson } from './loader'

let settingsPromise = null
export async function getSettings() {
  settingsPromise ??= loadJson('/data/settings.json')
  return { data: { data: await settingsPromise } }
}
