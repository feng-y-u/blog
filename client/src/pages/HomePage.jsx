import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts, getCategories } from '../api/posts'
import Loading from '../components/Loading'

const IMG_CLASSES = ['img-genshin', 'img-code', 'img-anime', 'img-rust', 'img-webgpu']
const IMG_LABELS = ['🎮', '📦', '🎬', '🦀', '⚡']
const IMG_BGS = [
  'linear-gradient(135deg, #1a2a4a 0%, #4a7a9a 40%, #8ab4d4 70%, #c8e0f0 100%)',
  'linear-gradient(135deg, #0a1a2a 0%, #1a3a5a 30%, #2a5a8a 60%, #0a2a4a 100%)',
  'linear-gradient(135deg, #2a1a3a 0%, #5a3a6a 30%, #9a6a8a 60%, #d0a0b0 100%)',
  'linear-gradient(135deg, #1a0a0a 0%, #3a1515 30%, #6a2525 60%, #8a3535 100%)',
  'linear-gradient(135deg, #0a1a2a 0%, #0a2a4a 30%, #1a4a7a 60%, #2a6a9a 100%)',
]

function ArticleCard({ post, index }) {
  const bgIdx = index % IMG_BGS.length
  return (
    <article className="article-card" style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      boxShadow: 'var(--shadow)',
      transition: 'var(--transition)',
      animation: 'fadeInUp 0.5s ease both',
      animationDelay: `${(index % 5) * 0.08}s`,
    }}>
      <Link to={`/post/${post.slug}`} style={{
        width: '260px', minHeight: '200px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '48px', position: 'relative', overflow: 'hidden', textDecoration: 'none',
        background: IMG_BGS[bgIdx],
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em',
          zIndex: 1, textShadow: '0 1px 8px rgba(0,0,0,0.5)',
        }}>{IMG_LABELS[bgIdx]} {post.category?.name || 'Article'}</span>
      </Link>
      <div className="article-card-body" style={{
        flex: 1, padding: '24px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div className="article-card-meta" style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '10px', fontSize: '12px', color: 'var(--fg-secondary)', flexWrap: 'wrap',
        }}>
          {post.category && (
            <span className="article-card-category" style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
              fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
              background: 'var(--accent-dim)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{post.category.name}</span>
          )}
          <span>Yuki</span>
          <span>·</span>
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN')}</span>
          <span>·</span>
          <span>约 {Math.max(1, Math.ceil((post.content?.length || 0) / 500))} 分钟</span>
        </div>
        <Link to={`/post/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="article-card-title" style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700,
            color: 'var(--fg)', lineHeight: 1.4, marginBottom: '10px',
            transition: 'var(--transition)',
          }}>{post.title}</h3>
        </Link>
        <p className="article-card-excerpt" style={{
          fontSize: '14px', color: 'var(--fg-secondary)', lineHeight: 1.7,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.excerpt || (post.content ? post.content.replace(/[#*`\[\]()>|\\]/g, '').slice(0, 200) : '')}
        </p>
        <div className="article-card-footer" style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px',
        }}>
          <Link to={`/post/${post.slug}`} className="article-card-readmore" style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--accent)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px',
            transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.gap = '8px'; e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.gap = '4px'; e.currentTarget.style.opacity = '1' }}>
            阅读全文 →
          </Link>
          {post.tags?.length > 0 && (
            <div className="article-card-tags" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {post.tags.slice(0, 3).map(tag => (
                <Link key={tag.id} to={`/tag/${tag.slug}`} className="tag" style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
                  fontSize: '11px', color: 'var(--fg-secondary)',
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
        </div>
      </div>
    </article>
  )
}

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 10 }
    if (searchQuery) params.search = searchQuery
    getPosts(params).then(res => {
      setPosts(res.data.data)
      setPagination(res.data.pagination)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page, searchQuery])

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts
    return posts.filter(post =>
      post.category?.slug === activeFilter ||
      post.tags?.some(t => t.slug === activeFilter)
    )
  }, [posts, activeFilter])

  function handleSearch(val) {
    setSearchQuery(val)
    setPage(1)
  }

  return (
    <div>
      <Helmet>
        <title>Yuki's Blog — 代码与动漫的世界</title>
        <meta name="description" content="个人博客，分享编程技术和动漫文化" />
      </Helmet>

      {/* 搜索栏 */}
      <div className="search-bar" style={{
        position: 'relative', marginBottom: '28px',
      }}>
        <span className="search-bar-icon" style={{
          position: 'absolute', left: '16px', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--fg-muted)',
          fontSize: '18px', pointerEvents: 'none',
        }}>🔍</span>
        <input type="text" placeholder="搜索文章标题、标签、内容…" autoComplete="off"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '14px 18px 14px 48px',
            borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--fg)',
            fontSize: '15px', fontFamily: 'var(--font-body)',
            transition: 'var(--transition)', boxShadow: 'var(--shadow)',
            outline: 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'var(--shadow)' }} />
        <div className="search-filter-row" style={{
          display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap',
        }}>
          <button onClick={() => setActiveFilter('all')}
            className="filter-btn"
            style={{
              padding: '5px 14px', borderRadius: '20px',
              border: activeFilter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeFilter === 'all' ? 'var(--accent-dim)' : 'transparent',
              color: activeFilter === 'all' ? 'var(--accent)' : 'var(--fg-secondary)',
              fontSize: '13px', cursor: 'pointer', transition: 'var(--transition)',
              fontFamily: 'var(--font-body)',
            }}>全部</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveFilter(activeFilter === cat.slug ? 'all' : cat.slug)}
              style={{
                padding: '5px 14px', borderRadius: '20px',
                border: activeFilter === cat.slug ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeFilter === cat.slug ? 'var(--accent-dim)' : 'transparent',
                color: activeFilter === cat.slug ? 'var(--accent)' : 'var(--fg-secondary)',
                fontSize: '13px', cursor: 'pointer', transition: 'var(--transition)',
                fontFamily: 'var(--font-body)',
              }}>{cat.name}</button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="section-header" style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '20px',
      }}>
        <h2 className="section-title" style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em',
        }}>
          {searchQuery ? `搜索结果` : '最近更新'}
        </h2>
        <span className="section-count" style={{ fontSize: '14px', color: 'var(--fg-secondary)' }}>
          共 {filteredPosts.length} 篇文章
        </span>
      </div>

      {/* Article List */}
      {loading ? (
        <Loading />
      ) : filteredPosts.length === 0 ? (
        <div className="no-results" style={{
          textAlign: 'center', padding: '60px 24px', color: 'var(--fg-muted)',
        }}>
          <div className="no-results-icon" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
          <div className="no-results-text" style={{ fontSize: '16px' }}>没有找到匹配的文章</div>
        </div>
      ) : (
        <div className="article-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredPosts.map((post, i) => (
            <ArticleCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
          marginTop: '40px', paddingBottom: '60px',
        }}>
          <button onClick={() => setPage(Math.max(1, page - 1))}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', color: 'var(--fg-secondary)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent',
              transition: 'var(--transition)',
            }}
            disabled={page === 1}>&lsaquo;</button>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                fontSize: '14px', cursor: 'pointer',
                border: page === p ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: page === p ? 'var(--accent)' : 'transparent',
                color: page === p ? '#fff' : 'var(--fg-secondary)',
                transition: 'var(--transition)',
              }}>{p}</button>
          ))}
          {pagination.totalPages > 10 && (
            <span className="ellipsis" style={{ border: 'none', color: 'var(--fg-muted)', padding: '0 4px' }}>…</span>
          )}
          <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
              fontSize: '14px', color: 'var(--fg-secondary)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent',
              transition: 'var(--transition)',
            }}
            disabled={page === pagination.totalPages}>&rsaquo;</button>
        </div>
      )}
    </div>
  )
}
