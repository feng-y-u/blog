// File System Access helpers: directory handle persistence (IndexedDB),
// permission handling, file read/write, markdown listing and image copying.
// Chromium only — callers must feature-detect `window.showDirectoryPicker`.

const IDB_NAME = 'writer-fs'
const IDB_STORE = 'handles'
const IDB_KEY = 'content-dir'

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key) {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key, value) {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function pickContentDir() {
  const dir = await window.showDirectoryPicker()
  await idbSet(IDB_KEY, dir)
  return dir
}

// Returns the persisted handle, or null when absent. The caller must check
// permission via ensureWritePermission() (which needs a user gesture when
// permission was not previously granted).
export async function restoreContentDir() {
  try {
    return (await idbGet(IDB_KEY)) || null
  } catch (err) {
    console.warn('恢复目录句柄失败:', err)
    return null
  }
}

export async function ensureWritePermission(dir) {
  if (!dir) return false
  if ((await dir.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await dir.requestPermission({ mode: 'readwrite' })) === 'granted'
}

export async function readTextFile(dir, name) {
  const handle = await dir.getFileHandle(name)
  const file = await handle.getFile()
  return file.text()
}

export async function writeTextFile(dir, name, text) {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

export async function listMarkdownFiles(dir) {
  const names = []
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file' && name.toLowerCase().endsWith('.md')) names.push(name)
  }
  return names.sort()
}

// Copies an image File into content/images/ (creating the dir if needed),
// resolving name collisions with a -1/-2 suffix. Returns the public URL.
export async function copyImageTo(dir, file, preferredName) {
  const imagesDir = await dir.getDirectoryHandle('images', { create: true })
  let name = (preferredName || file.name || 'image.png').replace(/[\\/:*?"<>|]/g, '-').trim()
  if (!name) name = 'image.png'
  const base = name.replace(/\.[^.]+$/, '')
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  let candidate = name
  let i = 1
  for (;;) {
    let exists = true
    try {
      await imagesDir.getFileHandle(candidate)
    } catch (err) {
      if (err?.name === 'NotFoundError') exists = false
      else throw err
    }
    if (!exists) break
    candidate = `${base}-${i}${ext}`
    i += 1
  }
  const handle = await imagesDir.getFileHandle(candidate, { create: true })
  const writable = await handle.createWritable()
  await writable.write(file)
  await writable.close()
  return `/images/${candidate}`
}
