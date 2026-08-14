import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getPosts } from '../api/posts'

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const seqRef = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(() => {
      const seq = ++seqRef.current
      setLoading(true)
      getPosts({ search: query, limit: 10 })
        .then(res => { if (seq === seqRef.current) setResults(res.data.data) })
        .catch(() => {})
        .finally(() => { if (seq === seqRef.current) setLoading(false) })
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '15vh',
        background: 'var(--modal-overlay)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: 'min(560px, 88vw)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 搜索输入框 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: '2px solid var(--accent-pink)',
        }}>
          <span style={{ fontSize: '20px', color: 'var(--accent-pink)' }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索文章…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--fg)',
              fontSize: '20px',
              fontWeight: 400,
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--fg-muted)', cursor: 'pointer',
              fontSize: '18px', padding: '4px',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)' }}
          >
            ✕
          </button>
        </div>

        {/* 快捷键提示 */}
        {!query && (
          <div style={{
            textAlign: 'center', marginTop: '48px',
            color: 'var(--fg-muted)', fontSize: '13px',
          }}>
            输入关键词搜索文章
            <br />
            <kbd style={{
              display: 'inline-block', marginTop: '8px',
              padding: '4px 10px',
              border: '1px solid var(--border)', borderRadius: '6px',
              fontSize: '12px', color: 'var(--fg-secondary)',
            }}>Esc</kbd> 关闭
          </div>
        )}

        {/* 结果列表 */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--fg-muted)', fontSize: '14px' }}>
            搜索中…
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {results.map(post => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                onClick={onClose}
                style={{
                  display: 'block',
                  padding: '14px 20px',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border)',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  color: 'var(--fg)', marginBottom: '4px',
                }}>
                  {post.title}
                </div>
                <div style={{
                  display: 'flex', gap: '8px', alignItems: 'center',
                  fontSize: '11px', color: 'var(--fg-muted)',
                }}>
                  {post.category && (
                    <span style={{ color: 'var(--accent-pink)' }}>{post.category.name}</span>
                  )}
                  <span>
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--fg-muted)', fontSize: '14px' }}>
            没有找到匹配的文章
          </div>
        )}
      </div>
    </div>
  )
}
