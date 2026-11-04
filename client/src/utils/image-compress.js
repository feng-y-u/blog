// Client-side image compression before storing via the writer tool.
// Encodes to WebP: re-encoding PNG as PNG (the old behaviour) kept screenshots
// at several megabytes, WebP cuts them by roughly 90% at the same size.
// Keeps GIF/SVG/WebP untouched; scales large JPEG/PNG down to maxWidth.
export async function compressImage(file, { maxWidth = 1600, quality = 0.86 } = {}) {
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
    const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality))
    if (!blob) return file
    // 扩展名必须跟着内容走，否则会存成“内容是 WebP、名字是 .png”的文件
    const name = file.name.replace(/\.(png|jpe?g)$/i, '.webp')
    return new File([blob], name, { type: 'image/webp' })
  } catch {
    return file // fall back to the original on any failure
  }
}
