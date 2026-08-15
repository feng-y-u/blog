import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPostBySlug, getPosts } from '../api/posts'
import { useSettings } from '../contexts/SettingsContext'
import Loading from '../components/Loading'
import ReadingProgress from '../components/ReadingProgress'
import Lightbox from '../components/Lightbox'
import ArticleMeta from '../components/ArticleMeta'
import ArticleToolbar from '../components/ArticleToolbar'
import TableOfContents, { extractTOC } from '../components/TableOfContents'
import ArticleBody from '../components/ArticleBody'
import ArticleFooter from '../components/ArticleFooter'
import AdjacentNav from '../components/AdjacentNav'

const FONT_SIZES = { small: '15px', medium: '16px', large: '19px' }
function getInitialFontSize() {
  return typeof window !== 'undefined' ? localStorage.getItem('article-font') || 'medium' : 'medium'
}
function getLocalViews(slug) {
  if (typeof window === 'undefined') return 0
  const key = `article-views-${slug}`
  const n = Number(localStorage.getItem(key) || 0)
  localStorage.setItem(key, String(n + 1))
  return n + 1
}

export default function PostDetailPage() {
  const { slug } = useParams()
  const { settings } = useSettings()
  const [post, setPost] = useState(null)
  const [adjacent, setAdjacent] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fontSize, setFontSize] = useState(getInitialFontSize)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [localViews, setLocalViews] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showTop, setShowTop] = useState(false)

  // Show the back-to-top button after scrolling down a bit.
  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      getPostBySlug(slug),
      getPosts({ limit: 100 }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([postRes, allRes]) => {
        if (cancelled) return
        const p = postRes.data.data
        if (!p) { setError('文章不存在'); return }
        setPost(p)
        setLocalViews(getLocalViews(p.slug))
        const list = allRes.data.data
        const idx = list.findIndex(x => x.slug === p.slug)
        setAdjacent({
          prev: idx > 0 ? list[idx - 1] : null,
          next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
        })
      })
      .catch(err => { if (!cancelled) setError(err.message || '文章不存在') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    document.documentElement.style.setProperty('--article-font-size', FONT_SIZES[fontSize])
    localStorage.setItem('article-font', fontSize)
  }, [fontSize])

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (loading) return <Loading />
  if (error) return <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--accent-pink)' }}>{error}</div>
  if (!post) return null

  const headings = extractTOC(post.content)

  return (
    <>
      <Helmet>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>
      <ReadingProgress />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <div className="article-page">
        {headings.length >= 2 && (
          <aside className="article-toc-sidebar">
            <TableOfContents headings={headings} />
          </aside>
        )}
        <div className="article-column">
          {post.coverImage && (
            <img src={post.coverImage} alt="" className="article-hero" />
          )}
          <article className="article-container">
            <ArticleMeta category={post.category} publishedAt={post.publishedAt} contentLength={post.content?.length} />
            <h1 className="article-title">{post.title}</h1>
            <ArticleToolbar author={settings?.profile_name || ''} viewCount={localViews} fontSize={fontSize} onFontSizeChange={setFontSize} />
            <ArticleBody content={post.content} onImageClick={setLightboxSrc} />
            <ArticleFooter tags={post.tags} onCopyLink={handleCopyLink} copied={copied} />
            <div className="article-copyright">
              本文作者：{settings?.profile_name || ''} · 本文链接：{typeof window !== 'undefined' ? window.location.href : ''}
              <br />
              版权声明：自由转载-非商用-非衍生-保持署名（CC BY-NC-SA 4.0）
            </div>
          </article>
          <AdjacentNav prev={adjacent.prev} next={adjacent.next} />
        </div>
      </div>
      {showTop && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="回到顶部">↑</button>
      )}
    </>
  )
}
