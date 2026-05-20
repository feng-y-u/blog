import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, deletePost, updatePostStatus } from '../../api/posts'

export default function PostManager() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  function loadPosts() {
    setLoading(true)
    getPosts({ limit: 100 })
      .then(res => setPosts(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(loadPosts, [])

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    await deletePost(id)
    loadPosts()
  }

  async function handleToggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await updatePostStatus(post.id, newStatus)
    loadPosts()
  }

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">文章管理</h1>
        <Link to="/admin/posts/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">写文章</Link>
      </div>
      <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3">标题</th>
            <th className="text-left p-3">分类</th>
            <th className="text-left p-3">状态</th>
            <th className="text-left p-3">发布时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3">{post.title}</td>
              <td className="p-3 text-sm text-gray-500">{post.category?.name || '-'}</td>
              <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${post.status === 'published' ? 'bg-green-100 text-green-700' : post.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{post.status}</span></td>
              <td className="p-3 text-sm text-gray-500">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '-'}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => handleToggleStatus(post)} className="text-sm text-blue-600 hover:underline">{post.status === 'published' ? '归档' : '发布'}</button>
                <Link to={`/admin/posts/${post.id}/edit`} className="text-sm text-green-600 hover:underline">编辑</Link>
                <button onClick={() => handleDelete(post.id)} className="text-sm text-red-600 hover:underline">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
