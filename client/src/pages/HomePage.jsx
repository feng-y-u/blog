import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import MagazineSpread from '../components/MagazineSpread'
import HomeSplash from '../components/HomeSplash'
import Loading from '../components/Loading'

const FEATURED_COUNT = 5

export default function HomePage({ onSearchOpen }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleIndex, setVisibleIndex] = useState(0)
  const scrollRef = useRef(null)

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
    const el = scrollRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.index)
            if (!isNaN(idx)) setVisibleIndex(idx)
          }
        }
      },
      { threshold: 0.5, root: el }
    )
    const items = el.querySelectorAll('[data-index]')
    items.forEach(child => observer.observe(child))
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
    <div
      ref={scrollRef}
      className="page-scroll-container"
    >
      <Helmet>
        <title>风予's Blog — 代码与动漫的世界</title>
        <meta name="description" content="个人博客，分享编程技术和动漫文化" />
      </Helmet>

      {/* Splash */}
      <HomeSplash scroller={scrollRef} />

      {/* 杂志跨页区 */}
      {featured.length > 0 && (
        <>
          {pairs.map((pair, pageIdx) => (
            <div
              key={pageIdx}
              data-index={pageIdx}
              className="magazine-page"
            >
              {/* 左侧：文章编号 */}
              <div className="magazine-numbering magazine-numbering-left">
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
              <div className="magazine-numbering magazine-numbering-right">
                <span style={{
                  fontSize: '10px',
                  color: 'var(--fg-muted)',
                  letterSpacing: '0.1em',
                  fontFeatureSettings: "'tnum' 1",
                }}>
                  — {String(pageIdx + 1).padStart(3, '0')} —
                </span>
              </div>

              {/* 内容 */}
              <div className="magazine-content">
                {pair.length === 2 ? (
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
                  <MagazineSpread
                    post={pair[0]}
                    index={pageIdx * 2}
                    isVisible={pageIdx === visibleIndex}
                  />
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* 页码指示器 */}
      {pairs.length > 1 && (
        <div className="page-indicator">
          {pairs.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current?.querySelector(`[data-index="${i}"]`)
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`page-dot ${i === visibleIndex ? 'page-dot-active' : ''}`}
              aria-label={`第 ${i + 1} 页`}
            />
          ))}
        </div>
      )}

      {/* 过渡标记 */}
      {rest.length > 0 && (
        <div className="rest-posts">
          <div className="rest-posts-divider">
            <span style={{ color: 'var(--accent-pink)', marginRight: '8px' }}>✦</span>
            More articles
            <span style={{ color: 'var(--accent-pink)', marginLeft: '8px' }}>✦</span>
          </div>

          <div className="rest-posts-list">
            {onSearchOpen && (
              <button
                onClick={onSearchOpen}
                className="search-trigger"
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-pink-dim)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-muted)' }}
              >
                <span style={{ fontSize: '16px' }}>⌕</span>
                搜索文章… <kbd className="search-kbd">⌘K</kbd>
              </button>
            )}

            {rest.map((post, i) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="rest-post-link"
                style={{ borderBottom: i < rest.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <div className="rest-post-title-row">
                  <span className="rest-post-title">{post.title}</span>
                  <span className="rest-post-date">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                    })}
                  </span>
                </div>
                {post.category && (
                  <span className="rest-post-category">{post.category.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 底部栏 — 放在滚动容器内避免两层滚动 */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px 48px',
        color: 'var(--fg-muted)',
        fontSize: '13px',
        borderTop: '1px solid var(--border)',
      }}>
        &copy; {new Date().getFullYear()} 风予's Blog. Built with ❤ &nbsp;|&nbsp; Powered by コードとアニメ<br />
        <Link to="/" style={{ color: 'var(--accent-pink)', textDecoration: 'none', margin: '0 4px' }}>首页</Link>
        {' · '}
        <a href="#" style={{ color: 'var(--accent-pink)', textDecoration: 'none', margin: '0 4px' }}>关于</a>
        {' · '}
        <a href="#" style={{ color: 'var(--accent-pink)', textDecoration: 'none', margin: '0 4px' }}>友情链接</a>
      </footer>
    </div>
  )
}
