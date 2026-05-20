import { Outlet, Link, useLocation } from 'react-router-dom'
import Banner from './Banner'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'

const SIDEBAR_PATHS = ['/', '/categories', '/category/', '/tags', '/tag/', '/search']

export default function Layout() {
  const location = useLocation()
  const showSidebar = SIDEBAR_PATHS.some(p => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-wide" style={{ color: 'var(--fg)' }}>
            Blog
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/">首页</NavLink>
            <NavLink to="/categories">分类</NavLink>
            <NavLink to="/tags">标签</NavLink>
            <NavLink to="/notes">笔记</NavLink>
            <NavLink to="/search">搜索</NavLink>
            <div className="ml-3">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Banner */}
      <Banner />

      {/* 主内容区：两栏布局 */}
      <div className="max-w-6xl mx-auto px-4 pb-12" style={{ marginTop: '-40px', position: 'relative', zIndex: 3 }}>
        <div className="flex gap-8">
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
          {showSidebar && (
            <div className="hidden lg:block flex-shrink-0">
              <div className="sticky top-20">
                <Sidebar />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 页脚 */}
      <footer className="border-t text-center py-6 text-sm" style={{
        borderColor: 'var(--border)',
        color: 'var(--fg-muted)',
      }}>
        &copy; {new Date().getFullYear()} Blog. All rights reserved.
      </footer>
    </div>
  )
}

function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
  return (
    <Link to={to}
      className="px-3 py-1.5 text-sm rounded-lg transition-all"
      style={{
        color: isActive ? 'var(--accent)' : 'var(--fg-secondary)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
      }}>
      {children}
    </Link>
  )
}
