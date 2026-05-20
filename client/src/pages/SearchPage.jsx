import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/posts'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (!q) return
    setLoading(true)
    getPosts({ search: q, limit: 50 })
      .then(res => setResults(res.data.data))
      .finally(() => setLoading(false))
  }, [searchParams])

  function handleSearch(e) {
    e.preventDefault()
    setSearchParams({ q: query })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">搜索</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="搜索文章标题或内容..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
      </form>
      {searchParams.get('q') && (
        <div>
          {loading ? <p>搜索中...</p> : results.length === 0
            ? <p className="text-gray-500">没有找到匹配的文章</p>
            : results.map(post => (
              <article key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                <span className="text-sm text-gray-500">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                <Link to={`/post/${post.slug}`}><h2 className="text-lg font-semibold hover:text-blue-600">{post.title}</h2></Link>
                {post.excerpt && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{post.excerpt}</p>}
              </article>
            ))
          }
        </div>
      )}
    </div>
  )
}
