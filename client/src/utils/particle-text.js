// Glyph sampling + particle field helpers for the home splash exit.
// Kept out of HomeSplash so the component stays readable (and under the
// 250-line ceiling from coding.md).

export const clamp01 = v => Math.min(1, Math.max(0, v))

export const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

// Draw `text` off-screen with the element's own font and return the centre of
// every opaque pixel run, in viewport coordinates.
//
// Sampling a wrapped or transformed element would produce glyphs that don't
// line up with what is on screen, so both cases are rejected: the caller then
// falls back to the CSS-only fade.
export function sampleGlyphs(el, text, stepPx = 2) {
  if (!el || !text) return []
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const fontSize = parseFloat(style.fontSize)
  if (!rect.width || !rect.height || !fontSize) return []
  if (rect.height > fontSize * 1.7) return []

  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  // Chrome only; ignored elsewhere and harmless.
  if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing

  // Centre the glyph box vertically inside the element box, otherwise every
  // sampled point sits a few pixels above the real text.
  const metrics = ctx.measureText(text)
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2
  ctx.fillText(text, 0, height / 2 + (ascent - descent) / 2)

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const step = Math.max(1, Math.round(stepPx * dpr))
  const points = []
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      if (data[(y * canvas.width + x) * 4 + 3] > 130) {
        points.push({ x: rect.left + x / dpr, y: rect.top + y / dpr })
      }
    }
  }
  return points
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = list[i]
    list[i] = list[j]
    list[j] = tmp
  }
  return list
}

// Pair the starting glyphs with the target glyphs. Shuffling first (instead of
// sampling with replacement) keeps the particles spread evenly over the whole
// word, so the dissolve reads as text rather than as clumps.
export function buildParticleField(fromPoints, toPoints, count, scatterRadius) {
  if (!fromPoints.length || !toPoints.length) return []
  const from = shuffle(fromPoints.slice())
  const to = shuffle(toPoints.slice())
  const field = []
  for (let i = 0; i < count; i++) {
    const start = from[i % from.length]
    const end = to[i % to.length]
    const angle = Math.random() * Math.PI * 2
    const radius = scatterRadius * (0.25 + Math.random() * 0.75)
    field.push({
      fx: start.x,
      fy: start.y,
      tx: end.x,
      ty: end.y,
      sx: Math.cos(angle) * radius,
      sy: Math.sin(angle) * radius - 24,
      size: 1 + Math.random() * 1.5,
      jitter: Math.random() * Math.PI * 2,
    })
  }
  return field
}
