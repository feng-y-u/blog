import { useState, useEffect } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[9999] transition-[width] duration-100"
      style={{
        width: `${Math.min(progress, 100)}%`,
        background: 'linear-gradient(90deg, var(--accent), #00f5ff)',
        boxShadow: '0 0 12px var(--accent-glow)',
      }}
    />
  )
}
