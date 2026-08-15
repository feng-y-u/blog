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
  let order = 0

  return (
    <div>
      <Helmet>
        <title>归档 — Blog</title>
      </Helmet>
      <h1 className="page-title">归档</h1>
      <div className="archive-timeline">
        {years.map(year => (
          <div key={year} className="archive-year">
            <div className="archive-year-label">{year} 年</div>
            {byYear[year].map(p => {
              const i = order++
              return (
                <div key={p.slug} className="archive-item"
                  style={{ animation: 'fadeInUp 0.4s ease both', animationDelay: `${i * 60}ms` }}>
                  <span className="archive-date">{(p.publishedAt || '').slice(0, 10)}</span>
                  <Link to={`/post/${p.slug}`} className="archive-title">{p.title}</Link>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {posts.length === 0 && (
        <p style={{ color: 'var(--fg-secondary)' }}>暂无文章</p>
      )}
    </div>
  )
}
