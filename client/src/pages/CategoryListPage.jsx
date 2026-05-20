import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../api/posts'
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
      <h1 className="text-2xl font-bold mb-6">分类列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Link key={cat.id} to={`/category/${cat.slug}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold">{cat.name}</h2>
            {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
            <span className="text-sm text-gray-400 mt-2 inline-block">{cat._count?.posts || 0} 篇文章</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
