import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../api/categories'
import Loading from '../components/Loading'

export default function CategoryListPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="page-title">分类列表</h1>
      <div className="card-grid">
        {categories.map(cat => (
          <Link key={cat.slug} to={`/category/${cat.slug}`} className="card card-hover" style={{ padding: '24px', textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{cat.name}</h2>
            {cat.description && <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', marginTop: '4px' }}>{cat.description}</p>}
            <span style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '8px', display: 'inline-block' }}>{cat._count?.posts || 0} 篇文章</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
