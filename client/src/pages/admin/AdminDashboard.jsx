import { useState, useEffect } from 'react'
import { getPosts, getCategories, getTags } from '../../api/posts'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ posts: '-', categories: '-', tags: '-' })

  useEffect(() => {
    Promise.all([
      getPosts({ limit: 1 }),
      getCategories(),
      getTags(),
    ]).then(([postsRes, catRes, tagRes]) => {
      setStats({
        posts: postsRes.data.pagination.total,
        categories: catRes.data.data.length,
        tags: tagRes.data.data.length,
      })
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.posts}</div>
          <div className="text-sm text-gray-500">文章总数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.categories}</div>
          <div className="text-sm text-gray-500">分类数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="text-2xl font-bold">{stats.tags}</div>
          <div className="text-sm text-gray-500">标签数</div>
        </div>
      </div>
    </div>
  )
}
