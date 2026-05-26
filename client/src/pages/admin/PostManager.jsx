import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, deletePost, updatePostStatus } from '../../api/posts'
import AdminToast from '../../components/AdminToast'
import Loading from '../../components/Loading'
import ConfirmModal from '../../components/ConfirmModal'
import { formatDate } from '../../utils/date'

export default function PostManager() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function loadPosts() {
    setLoading(true)
    getPosts({ limit: 100 })
      .then(res => setPosts(res.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(loadPosts, [])

  async function handleDelete(id) {
    setConfirmDelete({ id })
  }

  async function handleToggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      await updatePostStatus(post.id, newStatus)
      setToast(newStatus === 'published' ? '已发布' : '已归档')
      loadPosts()
    } catch { setToast({ type: 'error', text: '操作失败' }) }
  }

  const toastMsg = typeof toast === 'string' ? { type: 'success', text: toast } : toast

  if (loading) return <Loading />

  return (
    <div>
      <AdminToast message={toastMsg?.text} type={toastMsg?.type} onClose={() => setToast(null)} />
      <div className="admin-page-header">
        <h1 className="admin-page-title">文章管理</h1>
        <Link to="/admin/posts/new" className="admin-btn admin-btn-primary">写文章</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>状态</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id}>
                <td style={{ color: 'var(--fg)' }}>{post.title}</td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{post.category?.name || '-'}</td>
                <td>
                  <span className={`admin-badge ${post.status === 'published' ? 'admin-badge-published' : 'admin-badge-draft'}`}>
                    {post.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{post.publishedAt ? formatDate(post.publishedAt) : '-'}</td>
                <td>
                  <div className="admin-actions">
                    <button onClick={() => handleToggleStatus(post)} className="admin-action-publish">
                      {post.status === 'published' ? '归档' : '发布'}
                    </button>
                    <Link to={`/admin/posts/${post.id}/edit`} className="admin-action-edit">编辑</Link>
                    <button onClick={() => handleDelete(post.id)} className="admin-action-delete">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!confirmDelete}
        title="确认删除"
        message="确定删除此文章？此操作不可撤销。"
        confirmText="删除"
        danger
        onConfirm={async () => {
          try {
            await deletePost(confirmDelete.id)
            setToast('已删除')
            loadPosts()
          } catch { setToast({ type: 'error', text: '删除失败' }) }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
