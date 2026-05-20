import { useState, useEffect, useMemo } from 'react'

function extractTOC(content) {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/[`*_~]/g, '').trim()
    headings.push({
      level: match[1].length,
      text,
      id: text.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '')
    })
  }
  return headings
}

export default function TOC({ content }) {
  const [activeId, setActiveId] = useState('')
  const headings = useMemo(() => extractTOC(content), [content])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )

    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) return null

  function handleClick(id) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="hidden xl:block flex-shrink-0" style={{ width: '220px' }}>
      <div className="sticky top-20 rounded-xl p-4" style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>目录</h4>
        <ul className="space-y-1">
          {headings.map(h => (
            <li key={h.id}>
              <button
                onClick={() => handleClick(h.id)}
                className="block text-left w-full text-xs py-1 rounded transition-all"
                style={{
                  paddingLeft: h.level === 3 ? '16px' : '8px',
                  color: activeId === h.id ? 'var(--accent)' : 'var(--fg-muted)',
                  fontWeight: activeId === h.id ? 600 : 400,
                }}>
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
