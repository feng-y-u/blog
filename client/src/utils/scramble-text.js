// Title entrance animation: progressively reveals the final text through
// random katakana characters over a fixed number of frames.
export function scrambleText(finalText, onUpdate, onDone) {
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ'
  let current = finalText.split('')
  let frame = 0
  const maxFrames = 20

  function tick() {
    if (frame >= maxFrames) {
      onUpdate(finalText)
      onDone?.()
      return
    }
    const progress = frame / maxFrames
    const flipped = current.map((ch, i) => {
      if (ch === ' ' || i / current.length < progress) return ch
      return chars[Math.floor(Math.random() * chars.length)]
    })
    onUpdate(flipped.join(''))
    frame++
    requestAnimationFrame(tick)
  }
  tick()
}