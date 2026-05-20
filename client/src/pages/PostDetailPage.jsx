import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getPostBySlug, getAdjacentPosts } from '../api/posts'
import Loading from '../components/Loading'
import CommentSection from '../components/CommentSection'
import ReadingProgress from '../components/ReadingProgress'
import TOC from '../components/TOC'
import Lightbox from '../components/Lightbox'
import { formatDate } from '../utils/date'

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
    setLoading(true)
    setError(null)
    Promise.all([
      getPostBySlug(slug),
      // 需要 post.id 来获取相邻文章，这里先设为 null
    ]).then(([postRes]) => {
      const p = postRes.data.data
      setPost(p)
      return getAdjacentPosts(p.id).then(res => setAdjacent(res.data.data))
    }).catch(err => setError(err.response?.data?.error || '文章不存在'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    document.documentElement.style.setProperty('--article-font-size', FONT_SIZES[fontSize])
    localStorage.setItem('article-font', fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('fav-posts', JSON.stringify(favorites))
  }, [favorites])

  function handleFontChange(size) {
    setFontSize(size)
  }

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
  if (error) return <div className="text-center py-12" style={{ color: 'var(--accent)' }}>{error}</div>
  if (!post) return null

  const isFavorited = favorites.includes(post.id)

  return (
    <>
      <Helmet>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>
      <ReadingProgress />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      <div className="flex gap-8">
        {/* 文章主体 */}
        <article className="flex-1 min-w-0 max-w-3xl mx-auto">
          <Link to="/" className="text-sm mb-4 inline-block transition-colors hover:opacity-80" style={{ color: 'var(--fg-secondary)' }}>
            ← 返回首页
          </Link>

          <div className="mb-2">
            {post.category && (
              <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{post.category.name}</span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

          {/* 元信息 + 字体切换 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--fg-secondary)' }}>
              <span>{post.author?.displayName || '作者'}</span>
              <span>·</span>
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
              <span>·</span>
              <span>阅读 {post.viewCount}</span>
            </div>
            {/* 字体大小切换 */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {Object.entries({ small: 'S', medium: 'M', large: 'L' }).map(([key, label]) => (
                <button key={key} onClick={() => handleFontChange(key)}
                  className="w-7 h-7 text-xs rounded-md transition-all"
                  style={{
                    background: fontSize === key ? 'var(--accent-dim)' : 'transparent',
                    color: fontSize === key ? 'var(--accent)' : 'var(--fg-muted)',
                    fontWeight: fontSize === key ? 600 : 400,
                  }}>{label}</button>
              ))}
            </div>
          </div>

          {/* 文章内容 */}
          <div className="prose prose-lg max-w-none" style={{
            fontSize: 'var(--article-font-size)',
            color: 'var(--fg)',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                img: ({ src, alt }) => (
                  <img src={src} alt={alt || ''} className="cursor-pointer rounded-lg"
                    loading="lazy" onClick={() => setLightboxSrc(src)} />
                ),
                pre: ({ children }) => <pre className="relative">{children}</pre>,
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const lang = match ? match[1] : ''
                  const code = String(children).replace(/\n$/, '')
                  return (
                    <code className={className} {...props}>
                      {lang && (
                        <span className="absolute top-0 right-0 text-[11px] px-2 py-0.5 rounded-bl-md font-mono"
                          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                          {lang}
                        </span>
                      )}
                      {code}
                    </code>
                  )
                },
              }}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* 标签 */}
          {post.tags?.length > 0 && (
            <div className="flex items-center gap-2 mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>标签：</span>
              {post.tags.map(tag => (
                <Link key={tag.id} to={`/tag/${tag.slug}`}
                  className="text-sm px-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                  }}>{tag.name}</Link>
              ))}
            </div>
          )}

          {/* 文章操作按钮 */}
          <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              {copied ? '已复制' : '复制链接'}
            </button>
            <button onClick={handleToggleFavorite}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: isFavorited ? 'var(--accent)' : 'var(--fg-secondary)',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? 'var(--accent)' : 'none'} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              {isFavorited ? '已收藏' : '收藏'}
            </button>
            <button
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              举报
            </button>
          </div>

          {/* 上下篇导航 */}
          <div className="flex gap-4 mt-8">
            {adjacent.prev ? (
              <Link to={`/post/${adjacent.prev.slug}`}
                className="flex-1 rounded-xl p-4 transition-all hover:scale-[1.02]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>← 上一篇</div>
                <div className="text-sm font-medium line-clamp-2">{adjacent.prev.title}</div>
              </Link>
            ) : <div className="flex-1" />}
            {adjacent.next ? (
              <Link to={`/post/${adjacent.next.slug}`}
                className="flex-1 rounded-xl p-4 text-right transition-all hover:scale-[1.02]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>下一篇 →</div>
                <div className="text-sm font-medium line-clamp-2">{adjacent.next.title}</div>
              </Link>
            ) : <div className="flex-1" />}
          </div>

          {/* 评论区 */}
          <div className="mt-10">
            <CommentSection postId={post.id} />
          </div>
        </article>

        {/* TOC 侧边栏 */}
        <div className="hidden xl:block flex-shrink-0">
          <TOC content={post.content} />
        </div>
      </div>
    </>
  )
}
