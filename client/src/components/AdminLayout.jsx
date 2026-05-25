import { useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (!token) return null

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-sidebar-title">管理后台</Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link to="/admin" className="admin-nav-link">仪表盘</Link>
          <Link to="/admin/posts" className="admin-nav-link">文章管理</Link>
          <Link to="/admin/posts/new" className="admin-nav-link">写文章</Link>
          <Link to="/admin/categories" className="admin-nav-link">分类管理</Link>
          <Link to="/admin/tags" className="admin-nav-link">标签管理</Link>
          <Link to="/admin/comments" className="admin-nav-link">评论管理</Link>
          <Link to="/admin/notes" className="admin-nav-link">笔记管理</Link>
          <Link to="/admin/appearance" className="admin-nav-link">外观设置</Link>
        </nav>
        <button onClick={handleLogout} className="admin-logout-btn">退出登录</button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
