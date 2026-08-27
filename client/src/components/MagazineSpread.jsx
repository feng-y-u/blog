import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticleCanvas from './ParticleCanvas'
import { scrambleText } from '../utils/scramble-text'

export default function MagazineSpread({ post, index, compact, compactHeight }) {
  const [displayTitle, setDisplayTitle] = useState(post.title)
  const [scrambled, setScrambled] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const titleRef = useRef(null)
  const rootRef = useRef(null)
  const isLeft = index % 2 === 0
  // Decorative Japanese char: only shown when explicitly set in frontmatter (jpChar).
  const japaneseChar = post.jpChar || ''
  const hasCover = post.coverImage && !coverError

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const fn = e => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  // Fade the cover in once when the spread first scrolls into view; no global
  // paging state involved, so the entrance effect can't desync from what's
  // actually on screen.
  useEffect(() => {
    if (revealed) return
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setRevealed(true)
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  useEffect(() => {
    if (scrambled) return
    setScrambled(true)
    const timer = setTimeout(() => {
      scrambleText(post.title, setDisplayTitle)
    }, 300 + index * 150)
    return () => clearTimeout(timer)
  }, [post.title, index, scrambled])

  // On mobile: single column, cover fills the whole page, text sits on top.
  const textBg = hasCover && isMobile
    ? 'linear-gradient(180deg, rgba(13,13,20,0.1) 0%, rgba(13,13,20,0.55) 55%, rgba(13,13,20,0.8) 100%)'
    : 'var(--bg)'
  const fgOnCover = hasCover && isMobile ? 'rgba(255,255,255,0.92)' : 'var(--fg)'
  const secondaryOnCover = hasCover && isMobile ? 'rgba(255,255,255,0.7)' : 'var(--fg-secondary)'

  return (
    <div
      ref={rootRef}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : (compact ? '1.2fr 0.8fr' : '1fr 1fr'),
        height: compactHeight || (compact ? '50vh' : '100vh'),
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      {/* 全背景粒子 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ParticleCanvas />
      </div>

      {/* 封面视觉区：移动端为全屏背景，桌面为右/左栏 */}
      <div style={{
        position: isMobile ? 'absolute' : 'relative',
        inset: isMobile ? 0 : undefined,
        zIndex: 1,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        order: isLeft ? 2 : 1,
      }}>
        {hasCover && (
          <>
            <img
              src={post.coverImage}
              alt=""
              style={{
                position: 'absolute',
                inset: isMobile ? 0 : '20px',
                width: isMobile ? '100%' : 'calc(100% - 40px)',
                height: isMobile ? '100%' : 'calc(100% - 40px)',
                objectFit: 'cover',
                objectPosition: post.coverPosition || undefined,
                borderRadius: isMobile ? 0 : '16px',
                opacity: revealed ? 1 : 0,
                transition: 'opacity 0.6s ease-out, transform 0.8s ease-out',
                transform: revealed ? 'scale(1)' : 'scale(1.08)',
              }}
              loading="lazy" decoding="async"
              onError={() => setCoverError(true)}
            />
            <div style={{
              position: 'absolute',
              inset: isMobile ? 0 : '20px',
              borderRadius: isMobile ? 0 : '16px',
              background: isMobile
                ? 'linear-gradient(180deg, rgba(232,93,138,0.15), rgba(0,153,204,0.1))'
                : 'linear-gradient(135deg, rgba(232,93,138,0.35), rgba(0,153,204,0.25))',
            }} />
          </>
        )}

        {/* 日文大文字（移动端隐藏避免遮挡） */}
        {japaneseChar && !isMobile && (
        <div aria-hidden="true" style={{
          fontSize: compact ? 'clamp(36px, 5vw, 64px)' : 'clamp(60px, 8vw, 110px)',
          fontWeight: 900,
          color: hasCover ? 'rgba(255,255,255,0.9)' : 'var(--accent-pink-dim)',
          fontFamily: "'Noto Serif JP', 'Yu Mincho', serif",
          userSelect: 'none',
          letterSpacing: '-0.03em',
          position: 'relative',
          zIndex: 1,
          lineHeight: 1,
          textShadow: hasCover ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
        }}>
          {japaneseChar}
        </div>
        )}
      </div>

      {/* 文字栏 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isMobile ? 'flex-end' : 'center',
        padding: isMobile ? '56px 24px 40px' : (compact ? '24px 32px' : '64px 48px'),
        background: textBg,
        order: isMobile ? 3 : (isLeft ? 1 : 2),
        position: 'relative',
        zIndex: 2,
      }}>
        {/* 分类 + 日期 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: compact ? '8px' : '16px',
        }}>
          {post.category && (
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: 'var(--accent-pink)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              {post.category.name}
            </span>
          )}
          <span style={{ fontSize: '11px', color: secondaryOnCover }}>
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            })}
          </span>
        </div>

        {/* 标题 */}
        <h2
          ref={titleRef}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: compact ? 'clamp(18px, 2vw, 24px)' : 'clamp(28px, 3.2vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: fgOnCover,
            margin: compact ? '0 0 8px' : '0 0 16px',
            maxWidth: compact ? '100%' : '420px',
          }}
        >
          {displayTitle}
        </h2>

        {/* 摘要 — compact 模式下隐藏 */}
        {!compact && (
          <p style={{
            fontSize: '13px',
            lineHeight: 1.8,
            color: secondaryOnCover,
            margin: '0 0 20px',
            maxWidth: '380px',
          }}>
            {post.excerpt || (post.content ? post.content.replace(/[#*`\[\]()>|\\]/g, '').slice(0, 150) : '')}
          </p>
        )}

        {/* 标签 */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: compact ? '12px' : '24px' }}>
            {post.tags.slice(0, compact ? 2 : 4).map(tag => (
              <span key={tag.slug} style={{
                fontSize: '10px', padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid var(--accent-pink-dim)',
                color: 'var(--accent-pink)',
                letterSpacing: '0.02em',
                background: hasCover && isMobile ? 'rgba(13,13,20,0.35)' : 'transparent',
              }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 阅读按钮 */}
        <Link
          to={`/post/${post.slug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', fontWeight: 600,
            color: 'var(--accent-pink)',
            textDecoration: 'none',
            padding: '8px 0',
            borderBottom: '1px solid transparent',
            transition: 'var(--transition)',
            width: 'fit-content',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderBottomColor = 'var(--accent-pink-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
        >
          Read article
          <span style={{ fontSize: '16px', lineHeight: 1 }}>→</span>
        </Link>
      </div>
    </div>
  )
}