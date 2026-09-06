import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../api/categories'
import { getTags } from '../api/tags'
import Loading from '../components/Loading'
import TagCloud from '../components/TagCloud'

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

  const sectionTitle = {
    fontFamily: 'var(--font-display)',
    fontSize: '20px', fontWeight: 700,
    margin: '8px 0 16px', color: 'var(--fg)',
  }

  return (
    <div>
      <h1 className="page-title">索引</h1>

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
        <TagCloud tags={tags} />
      </div>
    </div>
  )
}
