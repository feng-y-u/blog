import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPostBySlug, getAdjacentPosts } from '../api/posts'
import Loading from '../components/Loading'
import CommentSection from '../components/CommentSection'
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

export default function PostDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [adjacent, setAdjacent] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fontSize, setFontSize] = useState(getInitialFontSize)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fav-posts') || '[]') } catch { return [] }
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getPostBySlug(slug)
      .then(({ data }) => {
        if (cancelled) return undefined
        const p = data.data
        setPost(p)
        return getAdjacentPosts(p.id)
      })
      .then(res => { if (res && !cancelled) setAdjacent(res.data.data) })
      .catch(err => { if (!cancelled) setError(err.response?.data?.error || '文章不存在') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    document.documentElement.style.setProperty('--article-font-size', FONT_SIZES[fontSize])
    localStorage.setItem('article-font', fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('fav-posts', JSON.stringify(favorites))
  }, [favorites])

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleToggleFavorite() {
    if (!post) return
    setFavorites(prev => prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id])
  }

  if (loading) return <Loading />
  if (error) return <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--accent-pink)' }}>{error}</div>
  if (!post) return null

  const isFavorited = favorites.includes(post.id)
  const headings = extractTOC(post.content)

  return (
    <>
      <Helmet>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>
      <ReadingProgress />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <article className="article-container">
        <ArticleMeta category={post.category} publishedAt={post.publishedAt || post.createdAt} contentLength={post.content?.length} />
        <h1 className="article-title">{post.title}</h1>
        <ArticleToolbar author={post.author?.displayName} viewCount={post.viewCount} fontSize={fontSize} onFontSizeChange={setFontSize} />
        <TableOfContents headings={headings} />
        <ArticleBody content={post.content} onImageClick={setLightboxSrc} />
        <ArticleFooter tags={post.tags} isFavorited={isFavorited} onToggleFavorite={handleToggleFavorite} onCopyLink={handleCopyLink} copied={copied} />
      </article>
      <AdjacentNav prev={adjacent.prev} next={adjacent.next} />
      <section className="comment-section">
        <CommentSection postId={post.id} />
      </section>
    </>
  )
}
