import { useState, useEffect } from 'react'
import client from '../../api/client'

const STATUS_MAP = { pending: '待审核', approved: '已批准', rejected: '已驳回' }
const STATUS_COLOR = { pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', approved: 'text-green-600 bg-green-50 dark:bg-green-900/20', rejected: 'text-red-600 bg-red-50 dark:bg-red-900/20' }

export default function CommentManager() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  function load() {
    setLoading(true)
    const params = { page, limit: 20 }
    if (filter) params.status = filter
    client.get('/comments', { params })
      .then(res => {
        setComments(res.data.data)
        setTotalPages(res.data.pagination.totalPages)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [page, filter])

  async function handleUpdate(id, data) {
    await client.put(`/comments/${id}`, data)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此评论？')) return
    await client.delete(`/comments/${id}`)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">评论管理</h1>

      <div className="flex items-center gap-2 mb-4">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}>
            {s ? STATUS_MAP[s] : '全部'}
          </button>
        ))}
      </div>

      <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3">文章</th>
            <th className="text-left p-3">作者</th>
            <th className="text-left p-3">评论</th>
            <th className="text-left p-3">状态</th>
            <th className="text-left p-3">时间</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {comments.map(comment => (
            <tr key={comment.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3 text-sm max-w-[200px] truncate">{comment.post?.title || '-'}</td>
              <td className="p-3 text-sm">
                <div>{comment.authorName}</div>
                {comment.authorEmail && <div className="text-xs text-gray-400">{comment.authorEmail}</div>}
              </td>
              <td className="p-3 text-sm text-gray-600 dark:text-gray-400 max-w-[300px] truncate">{comment.content}</td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[comment.status]}`}>
                  {STATUS_MAP[comment.status]}
                </span>
              </td>
              <td className="p-3 text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</td>
              <td className="p-3 flex gap-2">
                {comment.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdate(comment.id, { status: 'approved' })} className="text-sm text-green-600 hover:underline">批准</button>
                    <button onClick={() => handleUpdate(comment.id, { status: 'rejected' })} className="text-sm text-yellow-600 hover:underline">驳回</button>
                  </>
                )}
                <button onClick={() => handleDelete(comment.id)} className="text-sm text-red-600 hover:underline">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  )
}
