import { useRef, useEffect } from 'react'

const COLORS = [
  'rgba(232,93,138,',   // pink
  'rgba(0,153,204,',    // cyan
]

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3 - 0.08,
    size: Math.random() * 3 + 1.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.25 + 0.08,
    pulse: Math.random() * Math.PI * 2,
  }
}

export default function ParticleCanvas({ colorKey }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.scale(dpr, dpr)
      return { w: rect.width, h: rect.height }
    }

    let { w, h } = resize()
    const count = 35 + Math.floor(Math.random() * 15)
    particlesRef.current = Array.from({ length: count }, () => createParticle(w, h))

    function animate(time) {
      const { w: cw, h: ch } = resize()
      w = cw; h = ch
      ctx.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        p.pulse += 0.01
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1

        const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.06
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.max(0, Math.min(0.35, pulseAlpha)) + ')'
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [colorKey])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
