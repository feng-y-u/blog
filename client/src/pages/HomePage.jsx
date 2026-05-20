import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { getPosts } from '../api/posts'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getPosts({ page, limit: 10 }).then(res => {
      setPosts(res.data.data)
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }, [page])

  if (loading) return <Loading />

  return (
    <div>
      <Helmet>
        <title>Yuki's Blog — 代码与动漫的世界</title>
        <meta name="description" content="个人博客，分享编程技术和动漫文化" />
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">文章列表</h1>
      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <div key={post.id} className="animate-fade-in">
            <PostCard post={post} showExcerpt showTags />
          </div>
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className="px-3 py-1 rounded transition-all"
              style={{
                background: page === p ? 'var(--accent)' : 'var(--card)',
                color: page === p ? '#fff' : 'var(--fg-secondary)',
                border: '1px solid var(--border)',
              }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
