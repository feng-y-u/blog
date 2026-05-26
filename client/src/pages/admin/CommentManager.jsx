import { useState, useEffect } from 'react'
import client from '../../api/client'
import AdminToast from '../../components/AdminToast'
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'

const STATUS_MAP = { pending: '待审核', approved: '已批准', rejected: '已驳回' }

export default function CommentManager() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

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
    try {
      await client.put(`/comments/${id}`, data)
      setToast(data.status === 'approved' ? '已批准' : '已驳回')
      load()
    } catch { setToast({ type: 'error', text: '操作失败' }) }
  }

  async function handleDelete(id) {
    setConfirmDelete({ id })
  }

  if (loading) return <Loading />

  return (
    <div>
      <AdminToast message={toast?.text} type={toast?.type} onClose={() => setToast(null)} />
      <div className="admin-page-header">
        <h1 className="admin-page-title">评论管理</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1) }}
            className={s === filter ? 'admin-btn admin-btn-primary' : 'admin-btn'}
            style={s === filter ? {} : {}}>
            {s ? STATUS_MAP[s] : '全部'}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>文章</th>
              <th>作者</th>
              <th>评论</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(comment => (
              <tr key={comment.id}>
                <td style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comment.post?.title || '-'}</td>
                <td style={{ fontSize: '13px' }}>
                  <div style={{ color: 'var(--fg)' }}>{comment.authorName}</div>
                  {comment.authorEmail && <div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{comment.authorEmail}</div>}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comment.content}</td>
                <td>
                  <span className={`admin-badge ${comment.status === 'approved' ? 'admin-badge-published' : comment.status === 'rejected' ? 'admin-badge-draft' : 'admin-badge-pending'}`}>
                    {STATUS_MAP[comment.status]}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{new Date(comment.createdAt).toLocaleDateString('zh-CN')}</td>
                <td>
                  <div className="admin-actions">
                    {comment.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdate(comment.id, { status: 'approved' })} className="admin-action-publish">批准</button>
                        <button onClick={() => handleUpdate(comment.id, { status: 'rejected' })} className="admin-action-delete">驳回</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(comment.id)} className="admin-action-delete">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="admin-btn" style={{ opacity: page <= 1 ? 0.4 : 1 }}>上一页</button>
          <span style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="admin-btn" style={{ opacity: page >= totalPages ? 0.4 : 1 }}>下一页</button>
        </div>
      )}
      <ConfirmModal
        open={!!confirmDelete}
        title="确认删除"
        message="确定删除此评论？此操作不可撤销。"
        confirmText="删除"
        danger
        onConfirm={async () => {
          try {
            await client.delete(`/comments/${confirmDelete.id}`)
            setToast('已删除')
            load()
          } catch { setToast({ type: 'error', text: '删除失败' }) }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
