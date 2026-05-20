import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/posts'
import Loading from '../components/Loading'
import PostCard from '../components/PostCard'

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
          {loading ? <Loading text="搜索中..." /> : results.length === 0
            ? <p className="text-gray-500">没有找到匹配的文章</p>
            : results.map(post => <PostCard key={post.id} post={post} showExcerpt />)
          }
        </div>
      )}
    </div>
  )
}
