import { useState, useEffect } from 'react'
import { getPosts, getCategories, getTags } from '../../api/posts'
import client from '../../api/client'
import { getNotes } from '../../api/note'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ posts: '-', categories: '-', tags: '-', comments: '-', pendingComments: '-', notes: '-' })
  const [recentComments, setRecentComments] = useState([])

  useEffect(() => {
    Promise.all([
      getPosts({ limit: 1 }),
      getCategories(),
      getTags(),
      client.get('/comments', { params: { limit: 1 } }),
      client.get('/comments', { params: { status: 'pending', limit: 1 } }),
      getNotes({ limit: 1 }),
    ]).then(([postsRes, catRes, tagRes, commentsRes, pendingRes, notesRes]) => {
      setStats({
        posts: postsRes.data.pagination.total,
        categories: catRes.data.data.length,
        tags: tagRes.data.data.length,
        comments: commentsRes.data.pagination.total,
        pendingComments: pendingRes.data.pagination.total,
        notes: notesRes.data.pagination.total,
      })
    })

    client.get('/comments', { params: { limit: 5, status: 'pending' } })
      .then(res => setRecentComments(res.data.data))
      .catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="文章总数" value={stats.posts} />
        <StatCard label="分类数" value={stats.categories} />
        <StatCard label="标签数" value={stats.tags} />
        <StatCard label="评论总数" value={stats.comments} />
        <StatCard label="待审核评论" value={stats.pendingComments} highlight />
        <StatCard label="笔记总数" value={stats.notes} />
      </div>

      {recentComments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">待审核评论</h2>
          <div className="space-y-3">
            {recentComments.map(c => (
              <div key={c.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.authorName}</div>
                  <p className="text-sm text-gray-500 truncate">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">on {c.post?.title || '未知文章'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow ${highlight ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}
