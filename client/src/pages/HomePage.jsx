import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import MagazinePage from '../components/MagazinePage'
import HomeSplash from '../components/HomeSplash'
import PageIndicator from '../components/PageIndicator'
import RestPosts from '../components/RestPosts'
import SiteFooter from '../components/SiteFooter'
import Loading from '../components/Loading'

const FEATURED_COUNT = 6

export default function HomePage() {
  const { onSearchOpen } = useOutletContext() ?? {}
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleIndex, setVisibleIndex] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    getPosts({ limit: 20, page: 1 })
      .then(res => { setPosts(res.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        // The current page is the one with the largest visible portion. A
        // single 0.5 threshold latches the wrong page near the boundary
        // (adjacent 100vh pages can both sit at ~50%), so track ratio with
        // fine thresholds and always pick the max.
        let best = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry
        }
        if (best) {
          const idx = Number(best.target.dataset.index)
          if (!isNaN(idx)) setVisibleIndex(idx)
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], root: el }
    )
    const items = el.querySelectorAll('[data-index]')
    items.forEach(child => observer.observe(child))
    return () => observer.disconnect()
  }, [posts])

  const featured = posts.slice(0, FEATURED_COUNT)
  const rest = posts.slice(FEATURED_COUNT)

  const triples = []
  for (let i = 0; i < featured.length; i += 3) {
    triples.push(featured.slice(i, i + 3))
  }

  if (loading) return <Loading />

  return (
    <div ref={scrollRef} className="page-scroll-container">
      <Helmet>
        <title>风予's Blog — 代码与动漫的世界</title>
        <meta name="description" content="个人博客，分享编程技术和动漫文化" />
      </Helmet>

      <HomeSplash scroller={scrollRef} />

      {triples.length > 0 && triples.map((pagePosts, pageIdx) => (
        <MagazinePage
          key={pageIdx}
          posts={pagePosts}
          pageIndex={pageIdx}
          visibleIndex={visibleIndex}
        />
      ))}

      {triples.length > 1 && (
        <PageIndicator
          total={triples.length}
          active={visibleIndex}
          onNavigate={(i) => {
            const el = scrollRef.current?.querySelector(`[data-index="${i}"]`)
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      )}

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
