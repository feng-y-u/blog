import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import { useSettings } from '../contexts/SettingsContext'
import MagazineSpread from '../components/MagazineSpread'
import MagazineNumbering from '../components/MagazineNumbering'
import HomeSplash from '../components/HomeSplash'
import RestPosts from '../components/RestPosts'
import SiteFooter from '../components/SiteFooter'
import Loading from '../components/Loading'

const FEATURED_COUNT = 6
const ROW_SIZE = 3

export default function HomePage() {
  const { settings } = useSettings()
  const { onSearchOpen } = useOutletContext() ?? {}
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getPosts({ limit: 20, page: 1 })
      .then(res => { setPosts(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const featured = posts.slice(0, FEATURED_COUNT)
  const rest = posts.slice(FEATURED_COUNT)

  // Continuous scroll: no paging state, no snap — posts are grouped into
  // visual rows of ROW_SIZE only to keep the original compact density.
  const rows = []
  for (let i = 0; i < featured.length; i += ROW_SIZE) {
    rows.push(featured.slice(i, i + ROW_SIZE))
  }

  if (loading) return <Loading />

  return (
    <div ref={scrollRef} className="page-scroll-container">
      <Helmet>
        <title>{settings?.site_title || "风予's Blog"}</title>
        <meta name="description" content={settings?.profile_bio || '个人博客，分享编程技术和动漫文化'} />
      </Helmet>

      <HomeSplash scroller={scrollRef} />

      {rows.map((rowPosts, rowIdx) => (
        <div key={rowIdx} className="magazine-page">
          <MagazineNumbering side="left">
            {rowPosts.map((post, i) => {
              const n = rowIdx * ROW_SIZE + i
              return (
                <div key={post.slug} style={{
                  height: `calc(100vh / ${rowPosts.length})`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    fontSize: i === 0 && rowPosts.length >= 2 ? '20px' : '28px',
                    fontWeight: 800,
                    color: 'var(--accent-pink-dim)',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                  }}>
                    {String(n + 1).padStart(2, '0')}
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
              )
            })}
          </MagazineNumbering>

          <div className="magazine-content">
            {rowPosts.map((post, i) => (
              <MagazineSpread
                key={post.slug}
                post={post}
                index={rowIdx * ROW_SIZE + i}
                compact={rowPosts.length >= 2}
                compactHeight={rowPosts.length >= 2 ? `calc(100vh / ${rowPosts.length})` : undefined}
              />
            ))}
          </div>
        </div>
      ))}

      {rest.length > 0 && (
        <RestPosts
          posts={rest}
          searchTrigger={onSearchOpen ? (
            <button onClick={onSearchOpen} className="search-trigger">
              ⌕ 搜索文章… <kbd className="search-kbd">⌘K</kbd>
            </button>
          ) : null}
        />
      )}

      <SiteFooter />
    </div>
  )
}