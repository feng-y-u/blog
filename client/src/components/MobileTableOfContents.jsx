import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSections, headingElements, jumpToHeading } from './TableOfContents'

// Mobile/tablet TOC: floating trigger + bottom sheet with chapters and sections.
export default function MobileTableOfContents({ headings }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef(null)
  const activeRef = useRef(null)
  const closeRef = useRef(null)
  const fabRef = useRef(null)
  const wasOpen = useRef(false)
  const sections = useMemo(() => buildSections(headings), [headings])

  // Lock the page behind the sheet and close it with Escape.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Keep the highlighted row visible when the sheet opens far down the article.
  useEffect(() => {
    const list = listRef.current
    const el = activeRef.current
    if (!open || !list || !el) return
    const offset = el.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
    list.scrollTop = Math.max(0, offset - 8)
    closeRef.current?.focus()
    wasOpen.current = true
  }, [open])

  useEffect(() => {
    if (!open && wasOpen.current) fabRef.current?.focus()
  }, [open])

  if (sections.length < 2) return null

  const subCount = sections.reduce((n, s) => n + s.children.length, 0)

  function currentHeading() {
    const els = headingElements()
    let idx = 0
    headings.forEach((h, i) => {
      const el = els[h.domIndex]
      if (el && el.getBoundingClientRect().top <= 140) idx = i
    })
    return idx
  }

  function show() {
    setActive(currentHeading())
    setOpen(true)
  }

  function go(domIndex) {
    setOpen(false)
    // Let the sheet close before measuring the scroll target.
    setTimeout(() => jumpToHeading(domIndex), 0)
  }

  return (
    <>
      <button
        type="button"
        className="toc-fab"
        aria-expanded={open}
        aria-controls="toc-sheet"
        ref={fabRef}
        onClick={show}
      >
        目录
      </button>
      {open && (
        <div className="toc-sheet-layer" role="dialog" aria-modal="true" aria-labelledby="toc-sheet-title">
          <div className="toc-sheet-mask" onClick={() => setOpen(false)} />
          <div className="toc-sheet" id="toc-sheet">
            <div className="toc-sheet-head">
              <span className="toc-sheet-label" id="toc-sheet-title">目录</span>
              <span className="toc-sheet-meta">{sections.length} 章 · {subCount} 节</span>
              <button
                type="button"
                className="toc-sheet-close"
                aria-label="关闭目录"
                ref={closeRef}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="toc-sheet-body" ref={listRef}>
              <ol className="toc-mobile-list" id="toc-mobile-list">
                {sections.map(section => {
                  const hasBadges = section.children.some(c => c.badge)
                  return (
                    <li key={section.id} className="toc-mobile-sec">
                      <a
                        className={`toc-mobile-chapter${section.index === active ? ' active' : ''}`}
                        href={`#${section.id}`}
                        ref={section.index === active ? activeRef : undefined}
                        aria-current={section.index === active ? 'location' : undefined}
                        onClick={e => { e.preventDefault(); go(section.domIndex) }}
                      >
                        <span className="toc-mobile-num">{section.num}</span>
                        <span className="toc-mobile-title">{section.title}</span>
                      </a>
                      {section.children.length > 0 && (
                        <ul className="toc-mobile-subs">
                          {section.children.map(child => (
                            <li key={child.id}>
                              <a
                                className={child.index === active ? 'active' : ''}
                                href={`#${child.id}`}
                                ref={child.index === active ? activeRef : undefined}
                                aria-current={child.index === active ? 'location' : undefined}
                                onClick={e => { e.preventDefault(); go(child.domIndex) }}
                              >
                                {hasBadges && <span className="toc-mobile-badge">{child.badge}</span>}
                                <span className="toc-mobile-sub-text">{child.title}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
