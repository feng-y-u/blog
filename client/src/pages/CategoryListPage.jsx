import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../api/categories'
import { getTags } from '../api/tags'
import Loading from '../components/Loading'

export default function CategoryListPage() {
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([getCategories(), getTags()])
      .then(([catRes, tagRes]) => {
        if (cancelled) return
        setCategories(catRes.data.data)
        setTags(tagRes.data.data)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loading />

  const maxCount = Math.max(...tags.map(t => t._count?.posts || 0), 1)
  const sectionTitle = {
    fontFamily: 'var(--font-display)',
    fontSize: '20px', fontWeight: 700,
    margin: '8px 0 16px', color: 'var(--fg)',
  }

  return (
    <div>
      <h1 className="page-title">分类与标签</h1>

      <h2 style={sectionTitle}>分类</h2>
      <div className="card-grid">
        {categories.map(cat => (
          <Link key={cat.slug} to={`/category/${cat.slug}`} className="card card-hover" style={{ padding: '24px', textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{cat.name}</h2>
            {cat.description && <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', marginTop: '4px' }}>{cat.description}</p>}
            <span style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '8px', display: 'inline-block' }}>{cat._count?.posts || 0} 篇文章</span>
          </Link>
        ))}
      </div>
      {categories.length === 0 && <p style={{ color: 'var(--fg-secondary)' }}>暂无分类</p>}

      <h2 style={{ ...sectionTitle, marginTop: '40px' }}>标签</h2>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {tags.map(tag => {
            const count = tag._count?.posts || 0
            const weight = count / maxCount
            const size = 12 + weight * 16
            const opacity = 0.5 + weight * 0.5
            return (
              <Link
                key={tag.slug}
                to={`/tag/${tag.slug}`}
                className="tag"
                style={{
                  fontSize: `clamp(12px, ${size}px, 28px)`,
                  opacity,
                  transition: 'var(--transition)',
                }}
              >
                {tag.name}
                <span style={{ fontSize: '11px', color: 'var(--fg-muted)', marginLeft: '4px' }}>({count})</span>
              </Link>
            )
          })}
        </div>
        {tags.length === 0 && <p style={{ color: 'var(--fg-secondary)' }}>暂无标签</p>}
      </div>
    </div>
  )
}
