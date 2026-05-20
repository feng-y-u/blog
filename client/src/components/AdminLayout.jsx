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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <Link to="/admin" className="text-lg font-bold mb-6">管理后台</Link>
        <nav className="flex flex-col gap-2 flex-1">
          <Link to="/admin" className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">仪表盘</Link>
          <Link to="/admin/posts" className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">文章管理</Link>
          <Link to="/admin/posts/new" className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">写文章</Link>
          <Link to="/admin/categories" className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">分类管理</Link>
          <Link to="/admin/tags" className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">标签管理</Link>
        </nav>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 text-left px-3 py-2">退出登录</button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
