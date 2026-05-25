import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, deletePost, updatePostStatus } from '../../api/posts'
import Loading from '../../components/Loading'
import { formatDate } from '../../utils/date'

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

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>文章管理</h1>
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
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleToggleStatus(post)}
                    style={{ fontSize: '13px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>
                    {post.status === 'published' ? '归档' : '发布'}
                  </button>
                  <Link to={`/admin/posts/${post.id}/edit`}
                    style={{ fontSize: '13px', color: '#22c55e', textDecoration: 'underline' }}>编辑</Link>
                  <button onClick={() => handleDelete(post.id)}
                    style={{ fontSize: '13px', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
