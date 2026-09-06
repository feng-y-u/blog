import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPosts } from '../api/posts'
import { getCategoryBySlug } from '../api/categories'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'

export default function CategoryPage() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getPosts({ category: slug, limit: 50 }),
      getCategoryBySlug(slug),
    ])
      .then(([postsRes, catRes]) => {
        if (cancelled) return
        setPosts(postsRes.data.data)
        setCategory(catRes.data.data)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <Loading />

  return (
    <div>
      <Link to="/categories" className="back-link">← 索引</Link>

      {/* 分类头部卡片 */}
      {category && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{category.name}</h1>
            <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{category._count?.posts || posts.length} 篇文章</span>
          </div>
          {category.description && (
            <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', marginTop: '8px' }}>{category.description}</p>
          )}
          <div style={{
            marginTop: '16px', height: '2px',
            background: 'linear-gradient(90deg, var(--accent-pink-dim), var(--accent-cyan-dim))',
            borderRadius: '1px',
          }} />
        </div>
      )}

      <div className="post-list">
        {posts.map(post => <PostCard key={post.slug} post={post} />)}
        {posts.length === 0 && <p style={{ color: 'var(--fg-secondary)' }}>该分类下暂无文章</p>}
      </div>
    </div>
  )
}
