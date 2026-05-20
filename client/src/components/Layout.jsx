import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Blog</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-blue-600">首页</Link>
            <Link to="/categories" className="hover:text-blue-600">分类</Link>
            <Link to="/tags" className="hover:text-blue-600">标签</Link>
            <Link to="/notes" className="hover:text-blue-600">笔记</Link>
            <Link to="/search" className="hover:text-blue-600">搜索</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-700 text-center py-6 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Blog. All rights reserved.
      </footer>
    </div>
  )
}
