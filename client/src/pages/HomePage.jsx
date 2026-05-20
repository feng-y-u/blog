import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories, getTags } from '../api/posts'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
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

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    })
  }, [])

  if (loading) return <Loading />

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">文章列表</h1>
        <div className="flex flex-col gap-4">
          {posts.map(post => <PostCard key={post.id} post={post} showExcerpt showTags />)}
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${page === p ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
      <aside className="w-64 flex-shrink-0">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">分类</h3>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 flex justify-between">
                <span>{cat.name}</span>
                <span>({cat._count?.posts || 0})</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold mb-3">标签</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Link key={tag.id} to={`/tag/${tag.slug}`} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900">{tag.name}</Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
