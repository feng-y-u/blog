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
  margin: 36px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.article-body h3 {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
  margin: 28px 0 10px;
}
.article-body p { margin-bottom: 16px; }
.article-body strong { color: var(--fg); font-weight: 600; }
.article-body a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; transition: var(--transition); }
.article-body a:hover { border-bottom-color: var(--accent); }
.article-body pre {
  background: #0a0a12;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 20px 24px;
  overflow-x: auto;
  margin: 20px 0;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  color: #d4d4dc;
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
  background: var(--bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent);
}
.article-body pre code { background: none; padding: 0; border-radius: 0; color: #d4d4dc; }
.article-body blockquote {
  margin: 24px 0;
  padding: 16px 24px;
  border-left: 3px solid var(--accent);
  background: var(--bg);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--fg-secondary);
  font-style: italic;
}
.article-body ul, .article-body ol { margin: 12px 0 16px; padding-left: 24px; }
.article-body li { margin-bottom: 6px; }
.article-body img { max-width: 100%; border-radius: var(--radius-sm); cursor: pointer; margin: 24px 0; border: 1px solid var(--border); }
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

  function handleFontChange(size) { setFontSize(size) }

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
  const headings = extractTOC(post.content)

  return (
    <>
      <Helmet>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>
      <ReadingProgress />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* 返回链接 */}
      <Link to="/" className="back-link" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontSize: '14px', color: 'var(--fg-secondary)', textDecoration: 'none',
        marginBottom: '20px', transition: 'var(--transition)',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.gap = '10px' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.gap = '6px' }}>
        ← 返回文章列表
      </Link>

      {/* 文章详情卡片 */}
      <article className="article-detail" style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)',
        animation: 'fadeInUp 0.5s ease both',
      }}>
        {/* Hero 图片 */}
        <div className="article-hero" style={{
          width: '100%', height: '320px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '56px', position: 'relative',
          background: 'linear-gradient(135deg, #1a2a4a 0%, #4a7a9a 40%, #8ab4d4 70%, #c8e0f0 100%)',
        }}>
          <span className="hero-label" style={{
            fontFamily: 'var(--font-mono)', fontSize: '14px',
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em',
            zIndex: 1, textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}>🎮 {post.category?.name || 'Article'}</span>
        </div>

        {/* 文章头部 */}
        <div className="article-header" style={{ padding: '32px 40px 24px' }}>
          {post.category && (
            <div className="article-category" style={{
              display: 'inline-block', padding: '3px 12px', borderRadius: '4px',
              fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
              background: 'var(--accent-dim)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: '14px',
            }}>{post.category.name}</div>
          )}
          <h1 className="article-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 700, color: 'var(--fg)', lineHeight: 1.35, marginBottom: '16px',
          }}>{post.title}</h1>
          <div className="article-meta" style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            fontSize: '13px', color: 'var(--fg-secondary)', flexWrap: 'wrap',
          }}>
            <div className="author-avatar" style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-dim), rgba(100, 80, 200, 0.2))',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px',
            }}>🌸</div>
            <span>{post.author?.displayName || 'Yuki'}</span>
            <span className="article-meta-sep" style={{ color: 'var(--fg-muted)' }}>·</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span className="article-meta-sep" style={{ color: 'var(--fg-muted)' }}>·</span>
            <span>约 {Math.max(1, Math.ceil((post.content?.length || 0) / 500))} 分钟</span>
            <span className="article-meta-sep" style={{ color: 'var(--fg-muted)' }}>·</span>
            <span>阅读量 {post.viewCount}</span>
            {/* 字体切换 */}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              {Object.entries({ small: 'S', medium: 'M', large: 'L' }).map(([key, label]) => (
                <button key={key} onClick={() => handleFontChange(key)}
                  style={{
                    width: '24px', height: '24px', fontSize: '11px', lineHeight: '24px',
                    textAlign: 'center', borderRadius: '4px', cursor: 'pointer', border: 'none',
                    background: fontSize === key ? 'var(--accent-dim)' : 'transparent',
                    color: fontSize === key ? 'var(--accent)' : 'var(--fg-muted)',
                    fontWeight: fontSize === key ? 600 : 400,
                    transition: 'var(--transition)',
                  }}>{label}</button>
              ))}
            </span>
          </div>
        </div>

        {/* TOC 目录 (内联) */}
        {headings.length >= 2 && (
          <div className="article-toc" style={{
            margin: '0 40px 28px', padding: '20px 24px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div className="article-toc-title" style={{
              fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600,
              color: 'var(--fg-muted)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '12px',
            }}>目录</div>
            <ul className="article-toc-list" style={{ listStyle: 'none', padding: 0 }}>
              {headings.map(h => (
                <li key={h.id} style={{
                  position: 'relative', paddingLeft: h.level === 3 ? '28px' : '20px',
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
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)' }}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 文章正文 */}
        <style>{ARTICLE_BODY_CSS}</style>
        <div className="article-body" style={{
          padding: '0 40px 32px',
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

        {/* 文章底部 */}
        <div className="article-footer" style={{ padding: '24px 40px 32px', borderTop: '1px solid var(--border)' }}>
          {/* 标签 */}
          {post.tags?.length > 0 && (
            <div className="article-tags-section" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              flexWrap: 'wrap', marginBottom: '24px',
            }}>
              <span className="article-tags-label" style={{ fontSize: '13px', color: 'var(--fg-muted)', fontWeight: 500 }}>标签：</span>
              {post.tags.map(tag => (
                <Link key={tag.id} to={`/tag/${tag.slug}`} className="tag" style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                  fontSize: '12px', color: 'var(--fg-secondary)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'var(--transition)', textDecoration: 'none',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' }}>
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="article-actions" style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleCopyLink}
              className="article-action-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--fg-secondary)', fontSize: '13px',
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'var(--bg)' }}>
              🔗 {copied ? '已复制' : '复制链接'}
            </button>
            <button onClick={handleToggleFavorite}
              className="article-action-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: isFavorited ? 'var(--accent-dim)' : 'var(--bg)',
                color: isFavorited ? 'var(--accent)' : 'var(--fg-secondary)',
                fontSize: '13px', fontFamily: 'var(--font-body)', cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={e => { if (!isFavorited) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' } }}
              onMouseLeave={e => { if (!isFavorited) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'var(--bg)' } }}>
              {isFavorited ? '★' : '☆'} {isFavorited ? '已收藏' : '收藏'}
            </button>
            <button className="article-action-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--fg-secondary)', fontSize: '13px',
              fontFamily: 'var(--font-body)', cursor: 'pointer',
              transition: 'var(--transition)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.background = 'var(--bg)' }}>
              ⚠ 举报
            </button>
          </div>
        </div>
      </article>

      {/* 上下篇导航 */}
      <nav className="article-nav" style={{
        display: 'flex', gap: '20px', marginTop: '24px',
        animation: 'fadeInUp 0.5s ease both',
      }}>
        {adjacent.prev ? (
          <Link to={`/post/${adjacent.prev.slug}`} className="article-nav-link prev" style={{
            flex: 1, padding: '20px 24px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--card)',
            textDecoration: 'none', transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.background = 'var(--card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--card)' }}>
            <div className="article-nav-label" style={{ fontSize: '12px', color: 'var(--fg-muted)', marginBottom: '4px' }}>← 上一篇</div>
            <div className="article-nav-title" style={{
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--fg)',
              transition: 'var(--transition)',
            }}>{adjacent.prev.title}</div>
          </Link>
        ) : <div style={{ flex: 1 }} />}
        {adjacent.next ? (
          <Link to={`/post/${adjacent.next.slug}`} className="article-nav-link next" style={{
            flex: 1, padding: '20px 24px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--card)', textDecoration: 'none',
            textAlign: 'right', transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.background = 'var(--card-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--card)' }}>
            <div className="article-nav-label" style={{ fontSize: '12px', color: 'var(--fg-muted)', marginBottom: '4px' }}>下一篇 →</div>
            <div className="article-nav-title" style={{
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, color: 'var(--fg)',
              transition: 'var(--transition)',
            }}>{adjacent.next.title}</div>
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </nav>

      {/* 评论区 */}
      <section className="comments-section" style={{
        marginTop: '28px', background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '32px 40px', boxShadow: 'var(--shadow)',
        animation: 'fadeInUp 0.5s ease both',
      }}>
        <CommentSection postId={post.id} />
      </section>
    </>
  )
}
