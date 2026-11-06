import { useEffect, useMemo, useRef, useState } from 'react'

const CN_INDEX = /^[一二三四五六七八九十百]+、\s*/
const LEVEL_TAG = /^RCELABS-(\d+(?:\s*\/\s*\d+)?)(?:（([前后])半）)?[：:]\s*/

function makeId(text, used) {
  const base = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '') || 'heading'
  const n = (used.get(base) || 0) + 1
  used.set(base, n)
  return n === 1 ? base : `${base}-${n}`
}

// Extract h1–h3 headings, skipping fenced code and the leading H1 (page title).
export function extractTOC(content) {
  const used = new Map()
  const headings = []
  let inFence = false
  let domIndex = -1 // 0-based, matches querySelectorAll; the skipped leading H1 still counts
  let seenHeading = false
  for (const line of content.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{1,3})\s+(.+)$/.exec(line)
    if (!m) continue
    const level = m[1].length
    domIndex += 1
    const isLeadingTitle = level === 1 && !seenHeading
    seenHeading = true
    if (isLeadingTitle) continue
    const text = m[2].replace(/[`*_~]/g, '').trim()
    headings.push({ level, text, id: makeId(text, used), domIndex })
  }
  return headings
}

// Sections: h1 (part) / h2; items: h3. Only h2 increments the number; parts use ✦.
export function buildSections(headings) {
  const sections = []
  let current = null
  let num = 0
  headings.forEach((h, index) => {
    if (h.level <= 2) {
      if (h.level === 2) num += 1
      current = {
        id: h.id,
        domIndex: h.domIndex,
        index,
        num: h.level === 1 ? '✦' : String(num).padStart(2, '0'),
        title: h.text.replace(CN_INDEX, ''),
        children: [],
      }
      sections.push(current)
      return
    }
    if (!current) return
    const tag = LEVEL_TAG.exec(h.text)
    current.children.push({
      id: h.id,
      domIndex: h.domIndex,
      index,
      badge: tag ? `L${tag[1].replace(/\s*\/\s*/g, '/')}${tag[2] || ''}` : '',
      title: tag ? h.text.slice(tag[0].length) : h.text,
    })
  })
  return sections
}

export function headingElements() {
  return document.querySelectorAll('.article-body h1, .article-body h2, .article-body h3')
}

export function jumpToHeading(domIndex) {
  const el = headingElements()[domIndex]
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function TableOfContents({ headings }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [overrides, setOverrides] = useState({})
  const activeRef = useRef(null)
  const sections = useMemo(() => buildSections(headings), [headings])

  // Scroll spy: match by domIndex (the leading h1 title is skipped but still takes a slot).
  useEffect(() => {
    const els = headingElements()
    if (!els.length || !headings.length) return
    function onScroll() {
      const offset = 140
      let current = 0
      headings.forEach((h, i) => {
        const el = els[h.domIndex]
        if (el && el.getBoundingClientRect().top <= offset) current = i
      })
      setActiveIndex(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const activeSection = useMemo(() => {
    let idx = 0
    sections.forEach((s, i) => {
      if (s.index <= activeIndex) idx = i
    })
    return idx
  }, [sections, activeIndex])

  // Only the active section opens by default; once the user toggles, their choice wins.
  function isOpen(i) {
    return overrides[i] === undefined ? i === activeSection : overrides[i]
  }

  function toggle(i) {
    setOverrides(prev => ({ ...prev, [i]: !isOpen(i) }))
  }

  const expandable = sections.filter(s => s.children.length > 0)
  const allExpanded = expandable.length > 0 && sections.every((s, i) => !s.children.length || isOpen(i))

  function toggleAll() {
    const next = !allExpanded
    const patch = {}
    sections.forEach((s, i) => {
      if (s.children.length) patch[i] = next
    })
    setOverrides(patch)
  }

  const subCount = sections.reduce((n, s) => n + s.children.length, 0)
  const activeHeading = headings[activeIndex]
  const activeLabel = activeHeading
    ? activeHeading.text.replace(CN_INDEX, '').replace(LEVEL_TAG, '')
    : ''

  if (!sections.length) return null

  return (
    <div className="article-toc">
      <div className="toc-head">
        <span className="toc-label">目录</span>
        <span className="toc-meta">{sections.length} 章 · {subCount} 节</span>
      </div>
      <nav aria-label="文章目录">
        {sections.map((sec, si) => {
          const open = isOpen(si)
          const active = si === activeSection
          const hasChildren = sec.children.length > 0
          const hasBadges = sec.children.some(c => c.badge)
          const row = (
            <>
              <span className="toc-num">{sec.num}</span>
              <span className="toc-sec-title">{sec.title}</span>
              {hasChildren && <span className="toc-chev" aria-hidden="true" />}
            </>
          )
          return (
            <div key={sec.id} className={`toc-sec${open ? ' open' : ''}${active ? ' active' : ''}`}>
              {hasChildren ? (
                <button
                  type="button"
                  className="toc-sec-row"
                  aria-expanded={open}
                  onClick={() => toggle(si)}
                >
                  {row}
                </button>
              ) : (
                <a
                  className="toc-sec-row"
                  href={`#${sec.id}`}
                  onClick={e => { e.preventDefault(); jumpToHeading(sec.domIndex) }}
                >
                  {row}
                </a>
              )}
              {open && hasChildren && (
                <ul className={`toc-subs${hasBadges ? '' : ' no-badges'}`}>
                  {sec.children.map(child => {
                    const current = child.index === activeIndex
                    return (
                      <li key={child.id}>
                        <a
                          ref={current ? activeRef : undefined}
                          className={`toc-sub${current ? ' active' : ''}`}
                          href={`#${child.id}`}
                          aria-current={current ? 'location' : undefined}
                          onClick={e => { e.preventDefault(); jumpToHeading(child.domIndex) }}
                        >
                          {hasBadges && <span className="toc-badge">{child.badge}</span>}
                          <span className="toc-sub-text">{child.title}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
      <div className="toc-foot">
        <div className="toc-now">
          <span className="toc-now-label">正在读</span>
          <span className="toc-now-text" title={activeLabel}>{activeLabel}</span>
        </div>
        {expandable.length > 0 && (
          <button type="button" className="toc-expand" onClick={toggleAll}>
            {allExpanded ? '收起全部' : '展开全部'}
          </button>
        )}
      </div>
    </div>
  )
}
