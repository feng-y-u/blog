import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTags } from '../api/posts'

export default function TagCloudPage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTags().then(res => setTags(res.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12">加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">标签云</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map(tag => (
          <Link key={tag.id} to={`/tag/${tag.slug}`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
            {tag.name}
            <span className="text-xs text-gray-500 ml-1">({tag._count?.posts || 0})</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
