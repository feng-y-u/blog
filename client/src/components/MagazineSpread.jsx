import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticleCanvas from './ParticleCanvas'

const JAPANESE_CHARS = {
  tech: '構築',
  anime: '春',
  rust: '記録',
  default: '誌',
}

function getJapaneseChar(post) {
  const cat = post.category?.name?.toLowerCase() || ''
  if (cat.includes('rust') || cat.includes('tech')) return JAPANESE_CHARS.tech
  if (cat.includes('anime') || cat.includes('动漫') || cat.includes('新番')) return JAPANESE_CHARS.anime
  return JAPANESE_CHARS.default
}

function scrambleText(finalText, onUpdate, onDone) {
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

export default function MagazineSpread({ post, index, isVisible, compact, compactHeight }) {
  const [displayTitle, setDisplayTitle] = useState(post.title)
  const [scrambled, setScrambled] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const titleRef = useRef(null)
  const isLeft = index % 2 === 0
  const japaneseChar = post.jpChar || getJapaneseChar(post)
  const hasCover = post.coverImage && !coverError

  useEffect(() => {
    if (isVisible && !scrambled) {
      setScrambled(true)
      const timer = setTimeout(() => {
        scrambleText(post.title, setDisplayTitle)
      }, 300 + index * 150)
      return () => clearTimeout(timer)
    }
  }, [isVisible, post.title, index, scrambled])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1.2fr 0.8fr' : '1fr 1fr',
        height: compactHeight || (compact ? '50vh' : '100vh'),
        scrollSnapAlign: compact ? 'none' : 'start',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface)',
      }}
    >
      {/* 全背景粒子 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ParticleCanvas />
      </div>

      {/* 左栏：文字 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: compact ? '24px 32px' : '64px 48px',
        background: 'var(--bg)',
        order: isLeft ? 1 : 2,
        position: 'relative',
        zIndex: 1,
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
          <span style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
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
            color: 'var(--fg)',
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
            color: 'var(--fg-secondary)',
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

      {/* 右栏：视觉区 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        order: isLeft ? 2 : 1,
      }}>
        {/* 封面图背景 */}
        {hasCover && (
          <>
            <img
              src={post.coverImage}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.6s ease-out, transform 0.8s ease-out',
                transform: isVisible ? 'scale(1)' : 'scale(1.08)',
              }}
              loading="lazy" decoding="async"
              onError={() => setCoverError(true)}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(232,93,138,0.35), rgba(0,153,204,0.25))',
            }} />
          </>
        )}

        {/* 日文大文字 */}
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

        {/* 底部装饰 */}
        <div style={{
          position: 'absolute',
          bottom: '36px',
          right: isLeft ? '36px' : undefined,
          left: isLeft ? undefined : '36px',
          width: '64px',
          height: '2px',
          background: 'linear-gradient(90deg, var(--accent-pink-dim), var(--accent-cyan-dim))',
          borderRadius: '1px',
        }} />

        {/* Compact 模式分割线 */}
        {compact && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '48px',
            right: '48px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--accent-pink-dim), transparent)',
            opacity: 0.2,
            zIndex: 2,
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  )
}
