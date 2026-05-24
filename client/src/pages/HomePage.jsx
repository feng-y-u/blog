import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import MagazineSpread from '../components/MagazineSpread'
import Loading from '../components/Loading'

const FEATURED_COUNT = 5

export default function HomePage({ onSearchOpen }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleIndex, setVisibleIndex] = useState(0)
  const snapRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getPosts({ limit: 20, page: 1 })
      .then(res => {
        setPosts(res.data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // IntersectionObserver to track which spread is visible
  useEffect(() => {
    if (!snapRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index)
            if (!isNaN(idx)) setVisibleIndex(idx)
          }
        }
      },
      { threshold: 0.5 }
    )
    const items = snapRef.current.querySelectorAll('[data-index]')
    items.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [posts])

  const featured = posts.slice(0, FEATURED_COUNT)
  const rest = posts.slice(FEATURED_COUNT)

  // 两篇一组，每组一页
  const pairs = []
  for (let i = 0; i < featured.length; i += 2) {
    pairs.push(featured.slice(i, i + 2))
  }

  if (loading) return <Loading />

  return (
    <div>
      <Helmet>
        <title>Yuki's Blog — 代码与动漫的世界</title>
        <meta name="description" content="个人博客，分享编程技术和动漫文化" />
      </Helmet>

      {/* 杂志跨页区 — snap scroll */}
      {featured.length > 0 && (
        <div
          ref={snapRef}
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 96px',
            height: '100vh',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
          }}
        >
          {pairs.map((pair, pageIdx) => (
            <div key={pageIdx} data-index={pageIdx} style={{ scrollSnapAlign: 'start', position: 'relative' }}>
              {/* 左侧：文章编号 — 每篇一个 */}
              <div style={{
                position: 'absolute',
                left: '-96px',
                top: 0,
                width: '96px',
                height: '100vh',
                pointerEvents: 'none',
              }}>
                {pair.map((post, i) => (
                  <div key={post.id} style={{
                    height: pair.length === 2 ? '50vh' : '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontSize: i === 0 && pair.length === 2 ? '20px' : '28px',
                      fontWeight: 800,
                      color: 'var(--accent-pink-dim)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}>
                      {String(pageIdx * 2 + i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: 'var(--fg-muted)',
                      letterSpacing: '0.15em',
                      writingMode: 'vertical-rl',
                      height: '48px',
                      opacity: 0.6,
                    }}>
                      {post.category?.name || 'ARTICLE'}
                    </span>
                  </div>
                ))}
              </div>

              {/* 右侧：页码 */}
              <div style={{
                position: 'absolute',
                right: '-96px',
                top: 0,
                width: '96px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '36px',
                pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--fg-muted)',
                  letterSpacing: '0.1em',
                  fontFeatureSettings: "'tnum' 1",
                }}>
                  — {String(pageIdx + 1).padStart(3, '0')} —
                </span>
              </div>

              {pair.length === 2 ? (
                /* 两篇一组，每篇 50vh */
                <div style={{ height: '100vh' }}>
                  {pair.map((post, i) => (
                    <MagazineSpread
                      key={post.id}
                      post={post}
                      index={pageIdx * 2 + i}
                      isVisible={pageIdx === visibleIndex}
                      compact
                    />
                  ))}
                </div>
              ) : (
                /* 单篇（奇数篇数时兜底），全高 */
                <MagazineSpread
                  post={pair[0]}
                  index={pageIdx * 2}
                  isVisible={pageIdx === visibleIndex}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 页码指示器 */}
      {pairs.length > 1 && (
        <div style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10,
        }}>
          {pairs.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = snapRef.current?.querySelector(`[data-index="${i}"]`)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                border: 'none',
                background: i === visibleIndex ? 'var(--accent-pink)' : 'var(--border)',
                cursor: 'pointer',
                padding: 0,
                transition: 'var(--transition)',
                transform: i === visibleIndex ? 'scale(1.3)' : 'scale(1)',
              }}
              aria-label={`第 ${i + 1} 页`}
            />
          ))}
        </div>
      )}

      {/* 过渡标记 */}
      {rest.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div style={{
            textAlign: 'center',
            padding: '48px 24px 32px',
            color: 'var(--fg-muted)',
            fontSize: '12px',
            letterSpacing: '0.1em',
            position: 'relative',
          }}>
            <span style={{ color: 'var(--accent-pink)', marginRight: '8px' }}>✦</span>
            More articles
            <span style={{ color: 'var(--accent-pink)', marginLeft: '8px' }}>✦</span>
          </div>

          {/* 文章列表 */}
          <div style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '0 24px 48px',
          }}>
            {/* 列表区搜索提示 */}
            {onSearchOpen && (
              <button
                onClick={onSearchOpen}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '12px 16px',
                  marginBottom: '24px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--fg-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-pink-dim)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-muted)' }}
              >
                <span style={{ fontSize: '16px' }}>⌕</span>
                搜索文章… <kbd style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--fg-muted)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px' }}>⌘K</kbd>
              </button>
            )}

            {/* 纯文字文章列表 */}
            {rest.map((post, i) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                style={{
                  display: 'block',
                  padding: '16px 0',
                  textDecoration: 'none',
                  borderBottom: i < rest.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '16px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: 'var(--fg)',
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}>
                    {post.title}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--fg-muted)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                    })}
                  </span>
                </div>
                {post.category && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--accent-pink)',
                    marginTop: '4px',
                    display: 'inline-block',
                  }}>
                    {post.category.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
