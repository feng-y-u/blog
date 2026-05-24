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
    driftPivot: Math.random() * w,
    phase: Math.random() * Math.PI * 2,
    driftFreq: 0.008 + Math.random() * 0.012,
    driftAmp: rand(4, 16),
  }
}

export default function SnowEffect({ progressRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    let animId

    function resize() {
      const parent = canvas.parentElement
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = w
      canvas.height = h
      particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(w, h))
    }

    resize()
    window.addEventListener('resize', resize)

    function draw(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const progress = progressRef?.current ?? 0
      const globalAlpha = 1 - progress

      if (globalAlpha <= 0) {
        animId = requestAnimationFrame(draw)
        return
      }

      for (const p of particles) {
        p.y += p.speed
        p.x += Math.sin(time * p.driftFreq + p.phase) * p.driftAmp * 0.02

        if (p.y > canvas.height + p.size) {
          p.y = -p.size
          p.x = Math.random() * canvas.width
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
  }, [progressRef])

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
