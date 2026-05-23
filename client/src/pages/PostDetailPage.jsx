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
import Lightbox from '../components/Lightbox'
import { formatDate } from '../utils/date'

const FONT_SIZES = { small: '15px', medium: '16px', large: '19px' }

function getInitialFontSize() {
  return typeof window !== 'undefined' ? localStorage.getItem('article-font') || 'medium' : 'medium'
}

function extractTOC(content) {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const text = match[2].replace(/[`*_~]/g, '').trim()
    headings.push({
      level: match[1].length,
      text,
      id: text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, ''),
    })
  }
  return headings
}

const ARTICLE_BODY_CSS = `
.article-body h2 {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--fg);
  margin: 40px 0 14px;
}
.article-body h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  margin: 28px 0 10px;
}
.article-body p { margin-bottom: 16px; line-height: 1.9; }
.article-body strong { color: var(--fg); font-weight: 600; }
.article-body a { color: var(--accent-pink); text-decoration: none; border-bottom: 1px solid transparent; transition: var(--transition); }
.article-body a:hover { border-bottom-color: var(--accent-pink); }
.article-body pre {
  background: #f8f9fa;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px 24px;
  overflow-x: auto;
  margin: 24px 0;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  position: relative;
}
.article-body pre .lang-tag {
  position: absolute;
  top: 8px; right: 12px;
  font-size: 11px;
  color: var(--fg-muted);
  font-family: var(--font-body);
}
.article-body code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent-pink);
}
.article-body pre code { background: none; padding: 0; border-radius: 0; color: #333; }
.article-body blockquote {
  margin: 24px 0;
  padding: 16px 24px;
  border-left: 3px solid var(--accent-pink);
  background: var(--surface);
  border-radius: 0 8px 8px 0;
  color: var(--fg-secondary);
  font-style: italic;
}
.article-body ul, .article-body ol { margin: 12px 0 16px; padding-left: 24px; }
.article-body li { margin-bottom: 6px; }
.article-body img { max-width: 100%; border-radius: 8px; margin: 24px 0; border: 1px solid var(--border); }
`

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
    getPostBySlug(slug)
      .then(({ data }) => {
        const p = data.data
        setPost(p)
        return getAdjacentPosts(p.id)
      })
      .then(({ data }) => setAdjacent(data.data))
      .catch(err => setError(err.response?.data?.error || '文章不存在'))
      .finally(() => setLoading(false))
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
  if (error) return <div className="text-center py-12" style={{ color: 'var(--accent-pink)' }}>{error}</div>
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

      <article style={{
        maxWidth: '680px',
        margin: '0 auto',
      }}>
        {/* 分类 + 日期 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '12px',
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
          {post.category && <span style={{ color: 'var(--border)' }}>/</span>}
          <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
          <span style={{ color: 'var(--fg-muted)' }}>·</span>
          <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
            约 {Math.max(1, Math.ceil((post.content?.length || 0) / 500))} 分钟
          </span>
        </div>

        {/* 标题 */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 3.5vw, 40px)',
          fontWeight: 800,
          color: 'var(--fg)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}>
          {post.title}
        </h1>

        {/* 元信息 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 0 24px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '32px',
          fontSize: '13px',
          color: 'var(--fg-secondary)',
        }}>
          <span>{post.author?.displayName || 'Yuki'}</span>
          <span>·</span>
          <span>阅读量 {post.viewCount}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
            {Object.entries({ small: 'S', medium: 'M', large: 'L' }).map(([key, label]) => (
              <button key={key} onClick={() => setFontSize(key)}
                style={{
                  width: '24px', height: '24px', fontSize: '11px', lineHeight: '24px',
                  textAlign: 'center', borderRadius: '4px', cursor: 'pointer', border: 'none',
                  background: fontSize === key ? 'var(--accent-pink-dim)' : 'transparent',
                  color: fontSize === key ? 'var(--accent-pink)' : 'var(--fg-muted)',
                  fontWeight: fontSize === key ? 600 : 400,
                  transition: 'var(--transition)',
                  fontFamily: 'var(--font-body)',
                }}>{label}</button>
            ))}
          </span>
        </div>

        {/* TOC */}
        {headings.length >= 2 && (
          <div style={{
            padding: '20px 24px',
            marginBottom: '32px',
            background: 'var(--surface)',
            borderRadius: '8px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600,
              color: 'var(--fg-muted)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '12px',
            }}>目录</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {headings.map(h => (
                <li key={h.id} style={{
                  paddingLeft: h.level === 3 ? '28px' : '20px',
                  marginBottom: '6px', fontSize: '14px',
                }}>
                  <a href={`#${h.id}`} onClick={e => {
                    e.preventDefault()
                    const el = document.getElementById(h.id)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }} style={{
                    color: 'var(--fg-secondary)', textDecoration: 'none',
                    transition: 'var(--transition)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)' }}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 正文 */}
        <style>{ARTICLE_BODY_CSS}</style>
        <div className="article-body" style={{
          fontSize: 'var(--article-font-size)',
          lineHeight: 1.9,
          color: 'var(--fg)',
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              img: ({ src, alt }) => (
                <img src={src} alt={alt || ''} loading="lazy" onClick={() => setLightboxSrc(src)} />
              ),
              pre: ({ children }) => <pre>{children}</pre>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                const lang = match ? match[1] : ''
                return (
                  <code className={className} {...props}>
                    {lang && <span className="lang-tag">{lang}</span>}
                    {String(children).replace(/\n$/, '')}
                  </code>
                )
              },
            }}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* 底部标签 + 操作 */}
        <div style={{
          padding: '24px 0 32px',
          borderTop: '1px solid var(--border)',
          marginTop: '40px',
        }}>
          {post.tags?.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              flexWrap: 'wrap', marginBottom: '24px',
            }}>
              {post.tags.map(tag => (
                <Link key={tag.id} to={`/tag/${tag.slug}`} style={{
                  display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
                  fontSize: '11px', color: 'var(--accent-pink)',
                  border: '1px solid var(--accent-pink-dim)',
                  cursor: 'pointer', transition: 'var(--transition)', textDecoration: 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-pink-dim)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCopyLink} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--fg-secondary)', fontSize: '13px',
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-pink-dim)'; e.currentTarget.style.color = 'var(--accent-pink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}>
              🔗 {copied ? '已复制' : '复制链接'}
            </button>
            <button onClick={handleToggleFavorite} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px',
              border: '1px solid var(--border)',
              background: isFavorited ? 'var(--accent-pink-dim)' : 'var(--surface)',
              color: isFavorited ? 'var(--accent-pink)' : 'var(--fg-secondary)',
              fontSize: '13px', fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'var(--transition)',
            }}
              onMouseEnter={e => { if (!isFavorited) { e.currentTarget.style.borderColor = 'var(--accent-pink-dim)'; e.currentTarget.style.color = 'var(--accent-pink)' } }}
              onMouseLeave={e => { if (!isFavorited) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)' } }}>
              {isFavorited ? '★' : '☆'} {isFavorited ? '已收藏' : '收藏'}
            </button>
          </div>
        </div>
      </article>

      {/* 上下篇导航 */}
      <nav style={{
        display: 'flex',
        gap: '20px',
        maxWidth: '680px',
        margin: '0 auto 48px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border)',
      }}>
        {adjacent.prev ? (
          <Link to={`/post/${adjacent.prev.slug}`} style={{
            flex: 1, padding: '16px 20px',
            textDecoration: 'none',
            borderRadius: '8px',
            background: 'var(--surface)',
            transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}>
            <div style={{ fontSize: '11px', color: 'var(--fg-muted)', marginBottom: '4px' }}>← 上一篇</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.4 }}>
              {adjacent.prev.title}
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}
        {adjacent.next ? (
          <Link to={`/post/${adjacent.next.slug}`} style={{
            flex: 1, padding: '16px 20px',
            textDecoration: 'none',
            textAlign: 'right',
            borderRadius: '8px',
            background: 'var(--surface)',
            transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}>
            <div style={{ fontSize: '11px', color: 'var(--fg-muted)', marginBottom: '4px' }}>下一篇 →</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.4 }}>
              {adjacent.next.title}
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </nav>

      {/* 评论区 */}
      <section style={{
        maxWidth: '680px',
        margin: '0 auto 48px',
        paddingTop: '24px',
        borderTop: '1px solid var(--border)',
      }}>
        <CommentSection postId={post.id} />
      </section>
    </>
  )
}
