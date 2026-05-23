import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import Loading from '../components/Loading'

const DECORATIONS = ['✦']
const TAG_COLORS = [
  { bg: 'rgba(107,107,255,0.15)', fg: '#8b8bff' },
  { bg: 'rgba(255,107,157,0.15)', fg: '#ff6b9d' },
  { bg: 'rgba(0,212,255,0.15)', fg: '#00d4ff' },
  { bg: 'rgba(255,200,50,0.15)', fg: '#ffc832' },
]

function ArticleCard({ post, index }) {
  const [hovered, setHovered] = useState(false)
  const deco = DECORATIONS[0]

  return (
    <Link to={`/post/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <article
        style={{
          padding: '22px 24px',
          borderLeft: `3px solid ${hovered ? 'var(--accent-pink)' : 'transparent'}`,
          background: hovered ? 'var(--card-hover)' : 'transparent',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          transition: 'var(--transition)',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 分类 + 日期 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '8px',
        }}>
          {post.category && (
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
              fontSize: '11px', fontWeight: 600,
              color: 'var(--accent-pink)',
              background: 'var(--accent-pink-dim)',
              letterSpacing: '0.04em',
            }}>
              {post.category.name}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            })}
          </span>
        </div>

        {/* 标题 */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px', fontWeight: 700,
          color: hovered ? 'var(--accent)' : 'var(--fg)',
          lineHeight: 1.4, margin: '0 0 8px',
          transition: 'var(--transition)',
        }}>
          {deco} {post.title}
        </h3>

        {/* 摘要 */}
        <p style={{
          fontSize: '14px', color: 'var(--fg-secondary)',
          lineHeight: 1.65, margin: '0 0 12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.excerpt || (post.content ? post.content.replace(/[#*`\[\]()>|\\]/g, '').slice(0, 200) : '')}
        </p>

        {/* 标签 + 阅读时间 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {post.tags?.slice(0, 3).map((tag, i) => (
            <span key={tag.id} style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '12px',
              fontSize: '11px',
              color: TAG_COLORS[i % TAG_COLORS.length].fg,
              background: TAG_COLORS[i % TAG_COLORS.length].bg,
              border: 'none',
            }}>
              {tag.name}
            </span>
          ))}
          <span style={{
            marginLeft: 'auto', fontSize: '12px', color: 'var(--fg-muted)',
            opacity: hovered ? 1 : 0,
            transition: 'var(--transition)',
          }}>
            阅读 →
          </span>
        </div>
      </article>
    </Link>
  )
}

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 10 }
    if (searchQuery) params.search = searchQuery
    getPosts(params).then(res => {
      setPosts(res.data.data)
      setPagination(res.data.pagination)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page, searchQuery])

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

      {/* 搜索栏 — 毛玻璃风格悬浮在 Banner 底部 */}
      <div style={{
        marginTop: '-28px',
        marginBottom: '28px',
        position: 'relative',
        zIndex: 5,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(22,22,31,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          transition: 'var(--transition)',
        }}>
          <span style={{ fontSize: '16px', color: 'var(--fg-muted)', marginRight: '10px' }}>🔍</span>
          <input
            type="text"
            placeholder="搜索文章…"
            autoComplete="off"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '13px 0',
              background: 'transparent',
              border: 'none',
              color: 'var(--fg)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
            onFocus={e => { e.target.parentElement.style.borderColor = 'var(--accent)'; e.target.parentElement.style.boxShadow = '0 4px 24px rgba(0,212,255,0.12)' }}
            onBlur={e => { e.target.parentElement.style.borderColor = 'var(--border)'; e.target.parentElement.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)' }}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              style={{
                background: 'none', border: 'none', color: 'var(--fg-muted)',
                cursor: 'pointer', fontSize: '16px', padding: '4px',
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Section 标题 */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '10px',
        marginBottom: '16px', padding: '0 4px',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px', fontWeight: 600,
          color: 'var(--fg-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: 0,
        }}>
          {searchQuery ? '搜索结果' : '最近更新'}
        </h2>
        <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
          {posts.length} 篇
        </span>
      </div>

      {/* 文章列表 */}
      {loading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px', color: 'var(--fg-muted)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: '15px' }}>没有找到匹配的文章</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}>
          {posts.map((post, i) => (
            <div key={post.id}>
              <ArticleCard post={post} index={i} />
              {i < posts.length - 1 && (
                <div style={{
                  height: '1px',
                  margin: '0 24px',
                  background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
          marginTop: '32px',
        }}>
          <button onClick={() => setPage(Math.max(1, page - 1))}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              fontSize: '14px', color: 'var(--fg-secondary)', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent',
              transition: 'var(--transition)',
            }}
            disabled={page === 1}>&lsaquo;</button>
          {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{
                width: '36px', height: '36px', borderRadius: '8px',
                fontSize: '14px', cursor: 'pointer',
                border: page === p ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: page === p ? 'var(--accent)' : 'transparent',
                color: page === p ? '#fff' : 'var(--fg-secondary)',
                transition: 'var(--transition)',
              }}>{p}</button>
          ))}
          {pagination.totalPages > 10 && (
            <span style={{ color: 'var(--fg-muted)', padding: '0 2px' }}>…</span>
          )}
          <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
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
