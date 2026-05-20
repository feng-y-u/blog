import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPosts } from '../api/posts'

export default function CategoryPage() {
  const { slug } = useParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPosts({ category: slug, limit: 50 })
      .then(res => setPosts(res.data.data))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-center py-12">加载中...</div>

  return (
    <div>
      <Link to="/categories" className="text-sm text-gray-500 hover:text-blue-600 mb-4 inline-block">← 所有分类</Link>
      <h1 className="text-2xl font-bold mb-6">分类：{slug}</h1>
      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <article key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <span className="text-sm text-gray-500">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
            <Link to={`/post/${post.slug}`}>
              <h2 className="text-lg font-semibold hover:text-blue-600">{post.title}</h2>
            </Link>
          </article>
        ))}
        {posts.length === 0 && <p className="text-gray-500">该分类下暂无文章</p>}
      </div>
    </div>
  )
}
