import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/posts'
import { getCategories } from '../api/categories'
import SearchInput from '../components/SearchInput'
import CategoryFilter from '../components/CategoryFilter'
import SearchResults from '../components/SearchResults'
import EmptyState from '../components/EmptyState'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)
  const seqRef = useRef(0)

  useEffect(() => {
    getCategories().then(res => setCategories(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  function doSearch(q, category) {
    const params = { search: q, limit: 50 }
    if (category) params.category = category
    const seq = ++seqRef.current
    setLoading(true)
    setSearched(true)
    getPosts(params)
      .then(res => { if (seq === seqRef.current) setResults(res.data.data) })
      .catch(() => { if (seq === seqRef.current) setResults([]) })
      .finally(() => { if (seq === seqRef.current) setLoading(false) })
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

  function handleSearch(val) {
    if (val.trim()) {
      const params = { q: val.trim() }
      if (activeCategory) params.category = activeCategory
      setSearchParams(params)
    }
  }

  return (
    <div>
      <Helmet>
        <title>{query ? `${query} — 搜索` : '搜索'} — Blog</title>
      </Helmet>
      <h1 className="page-title">搜索</h1>
      <SearchInput value={query} onChange={handleInputChange} onSearch={handleSearch} />
      <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryClick={handleCategoryClick} />
      {searched ? (
        <SearchResults results={results} keyword={query} loading={loading} />
      ) : (
        <EmptyState
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          text="输入关键词搜索文章"
        />
      )}
    </div>
  )
}
