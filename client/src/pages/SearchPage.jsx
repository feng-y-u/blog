import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { getPosts, getCategories } from '../api/posts'
import Loading from '../components/Loading'

function highlightText(text, keyword) {
  if (!keyword) return text
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark>
      : part
  )
}

function HighlightedPostCard({ post, keyword }) {
  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        {post.category && <span className="text-blue-600 font-medium">{post.category.name}</span>}
        <span>·</span>
        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
      </div>
      <a href={`/post/${post.slug}`} className="block">
        <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">
          {highlightText(post.title, keyword)}
        </h2>
      </a>
      {post.excerpt && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {highlightText(post.excerpt, keyword)}
        </p>
      )}
    </article>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  function doSearch(q, category) {
    const params = { search: q, limit: 50 }
    if (category) params.category = category
    setLoading(true)
    setSearched(true)
    getPosts(params)
      .then(res => setResults(res.data.data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('category') || ''
    setQuery(q)
    setActiveCategory(cat)
    if (q) doSearch(q, cat)
    else setSearched(false)
  }, [searchParams])

  function handleInputChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        const params = { q: val.trim() }
        if (activeCategory) params.category = activeCategory
        setSearchParams(params)
      } else {
        setSearchParams({})
      }
    }, 300)
  }

  function handleCategoryClick(slug) {
    const next = slug === activeCategory ? '' : slug
    setActiveCategory(next)
    if (query.trim()) {
      const params = { q: query.trim() }
      if (next) params.category = next
      setSearchParams(params)
    }
  }

  return (
    <div>
      <Helmet>
        <title>{query ? `${query} — 搜索` : '搜索'} — Blog</title>
      </Helmet>
      <h1 className="text-2xl font-bold mb-6">搜索</h1>

      <div className="relative mb-4">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={query} onChange={handleInputChange}
          placeholder="搜索文章标题或内容..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm shadow-sm focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => handleCategoryClick('')}
            className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors ${!activeCategory ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'}`}>
            全部
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3.5 py-1.5 text-sm rounded-full border transition-colors ${activeCategory === cat.slug ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {searched && (
        <div>
          {loading ? <Loading text="搜索中..." /> : results.length === 0
            ? <div className="text-center py-16">
                <svg className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400">没有找到匹配的文章</p>
                <p className="text-sm text-gray-400 mt-1">试试其他关键词或分类</p>
              </div>
            : <div className="space-y-4">
                <p className="text-sm text-gray-500">找到 {results.length} 条结果</p>
                {results.map(post => (
                  <HighlightedPostCard key={post.id} post={post} keyword={query} />
                ))}
              </div>
          }
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>输入关键词搜索文章</p>
        </div>
      )}
    </div>
  )
}
