import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPosts } from '../api/posts'
import { getTags } from '../api/tags'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'

export default function TagPage() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])
  const [tag, setTag] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getPosts({ tag: slug, limit: 50 }),
      getTags(),
    ])
      .then(([postsRes, tagsRes]) => {
        if (cancelled) return
        setPosts(postsRes.data.data)
        setTag(tagsRes.data.data.find(t => t.slug === slug) || null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  if (loading) return <Loading />

  return (
    <div>
      <Link to="/categories" className="back-link">← 索引</Link>

      {/* 标签头部卡片 */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>#{tag?.name || slug}</h1>
          <span style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>{tag?._count?.posts || posts.length} 篇文章</span>
        </div>
        <div style={{
          marginTop: '16px', height: '2px',
          background: 'linear-gradient(90deg, var(--accent-pink-dim), var(--accent-cyan-dim))',
          borderRadius: '1px',
        }} />
      </div>

      <div className="post-list">
        {posts.map(post => <PostCard key={post.slug} post={post} />)}
        {posts.length === 0 && <p style={{ color: 'var(--fg-secondary)' }}>该标签下暂无文章</p>}
      </div>
    </div>
  )
}
