import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import Loading from '../components/Loading'

export default function ArchivesPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getPosts({ limit: 100 })
      .then(res => { if (!cancelled) setPosts(res.data.data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loading />

  // Group by year, newest first (posts.json is already date-desc).
  const byYear = {}
  for (const p of posts) {
    const year = (p.publishedAt || '').slice(0, 4) || '未知'
    ;(byYear[year] ||= []).push(p)
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <Helmet>
        <title>归档 — Blog</title>
      </Helmet>
      <h1 className="page-title">归档</h1>
      {years.map(year => (
        <div key={year} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '16px', color: 'var(--fg)' }}>
            {year} 年
          </h2>
          <div className="card" style={{ padding: '8px 24px' }}>
            {byYear[year].map(p => (
              <div key={p.slug} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <Link to={`/post/${p.slug}`} style={{ color: 'var(--fg)', textDecoration: 'none', fontSize: '14px' }}>
                  {p.title}
                </Link>
                <span style={{ fontSize: '12px', color: 'var(--fg-muted)', flexShrink: 0, marginLeft: '16px' }}>
                  {(p.publishedAt || '').slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {posts.length === 0 && (
        <p style={{ color: 'var(--fg-secondary)' }}>暂无文章</p>
      )}
    </div>
  )
}
