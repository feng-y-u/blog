import { useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: '仪表盘', emoji: '📊', exact: true },
  { to: '/admin/posts', label: '文章管理', emoji: '📝' },
  { to: '/admin/posts/new', label: '写文章', emoji: '✏️' },
  { to: '/admin/categories', label: '分类管理', emoji: '🏷️' },
  { to: '/admin/tags', label: '标签管理', emoji: '🔖' },
  { to: '/admin/comments', label: '评论管理', emoji: '💬' },
  { to: '/admin/notes', label: '笔记管理', emoji: '📓' },
  { to: '/admin/appearance', label: '外观设置', emoji: '🎨' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  function isActive(item) {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  if (!token) return null

  return (
    <div className="admin-layout admin-layout-new">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-sidebar-title">博客后台</Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link${isActive(item) ? ' active' : ''}`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="admin-logout-btn">
          <span>↪️</span>
          <span>退出登录</span>
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
