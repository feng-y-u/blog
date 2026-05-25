import { useRef, useEffect } from 'react'

const PARTICLE_COUNT = 60
const SIZE_MIN = 1
const SIZE_MAX = 6
const SPEED_MIN = 1.5
const SPEED_MAX = 4
const OPACITY_MIN = 0.3
const OPACITY_MAX = 0.9

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function createParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h * 2 - h,
    size: rand(SIZE_MIN, SIZE_MAX),
    speed: rand(SPEED_MIN, SPEED_MAX),
    opacity: rand(OPACITY_MIN, OPACITY_MAX),
    phase: Math.random() * Math.PI * 2,
    driftFreq: 0.008 + Math.random() * 0.012,
    driftAmp: rand(4, 16),
  }
}

function repositionParticle(p, w, h) {
  p.x = Math.random() * w
  p.y = Math.random() * h * 2 - h
  return p
}

export default function SnowEffect({ progressRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    let animId
    let dpr

    function resize() {
      dpr = window.devicePixelRatio || 1
      const rect = canvas.parentElement.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (particles.length === 0) {
        particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(w, h))
      } else {
        for (const p of particles) {
          if (p.y > h + p.size || p.x < -50 || p.x > w + 50) {
            repositionParticle(p, w, h)
          }
        }
      }
      return { w, h }
    }

    let { w, h } = resize()
    window.addEventListener('resize', resize)

    function draw(time) {
      const progress = progressRef?.current ?? 0
      const globalAlpha = 1 - progress

      if (globalAlpha <= 0) {
        ctx.clearRect(0, 0, w, h)
        animId = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.y += p.speed
        p.x += Math.sin(time * p.driftFreq + p.phase) * p.driftAmp * 0.02

        if (p.y > h + p.size) {
          p.y = -p.size
          p.x = Math.random() * w
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * globalAlpha})`
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
