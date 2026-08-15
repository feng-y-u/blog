// Client-side image compression before storing via the writer tool.
// Keeps GIF/SVG/WebP untouched; scales large JPEG/PNG down to maxWidth and
// re-encodes JPEG at `quality`. Returns the original file when not needed.
export async function compressImage(file, { maxWidth = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type.startsWith('image/')) return file
  if (!['image/jpeg', 'image/png'].includes(file.type)) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxWidth / bitmap.width)
    if (scale >= 1 && file.size <= 400 * 1024) return file // small enough already
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise(res => canvas.toBlob(res, mime, quality))
    if (!blob) return file
    return new File([blob], file.name, { type: mime })
  } catch {
    return file // fall back to the original on any failure
  }
}
