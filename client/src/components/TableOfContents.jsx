import { useState, useEffect } from 'react'

function makeId(text, used) {
  const base = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '') || 'heading'
  const n = (used.get(base) || 0) + 1
  used.set(base, n)
  return n === 1 ? base : `${base}-${n}`
}

// Extract h2/h3 headings from markdown, skipping fenced code blocks.
export function extractTOC(content) {
  const used = new Map()
  const headings = []
  let inFence = false
  for (const line of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+)$/.exec(line)
    if (!m) continue
    const text = m[2].replace(/[`*_~]/g, '').trim()
    headings.push({ level: m[1].length, text, id: makeId(text, used) })
  }
  return headings
}

// Scroll to the Nth heading in the rendered article body (order matches extractTOC).
function handleClick(index) {
  return (e) => {
    e.preventDefault()
    const els = document.querySelectorAll('.article-body h2, .article-body h3')
    const el = els[index]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function TableOfContents({ headings }) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Scroll spy: highlight the TOC entry of the heading currently in view.
  useEffect(() => {
    const els = document.querySelectorAll('.article-body h2, .article-body h3')
    if (!els.length) return
    function onScroll() {
      const offset = 140 // navbar height + breathing room
      let current = 0
      for (let i = 0; i < els.length; i++) {
        if (els[i].getBoundingClientRect().top <= offset) current = i
      }
      setActiveIndex(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  if (headings.length < 2) return null

  return (
    <div className="article-toc">
      <div className="article-toc-title">目录</div>
      <ul className="article-toc-list">
        {headings.map((h, i) => (
          <li
            key={i}
            className={`article-toc-item article-toc-item-${h.level === 3 ? 'h3' : 'h2'}${i === activeIndex ? ' active' : ''}`}
          >
            <a
              href={`#${h.id}`}
              className="article-toc-link"
              onClick={handleClick(i)}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
