import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import SearchModal from './SearchModal'
import SiteFooter from './SiteFooter'

const SIDEBAR_PATHS = ['/categories', '/category/', '/tag/', '/search', '/archives']

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const showSidebar = SIDEBAR_PATHS.some(p => location.pathname.startsWith(p))
  const [searchOpen, setSearchOpen] = useState(false)

  // ⌘K / Ctrl+K 快捷键
  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <Navbar onSearchOpen={() => setSearchOpen(true)} />

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* 主内容 */}
      {isHome ? (
        /* 首页：全屏无容器约束 */
        <main className="page-enter" key={location.key} style={{ paddingTop: '56px' /* navbar height */ }}>
          <Outlet context={{ onSearchOpen: () => setSearchOpen(true) }} />
        </main>
      ) : (
        /* 其他页面：带容器和侧边栏 */
        <div className="page-enter" key={location.key} style={{
          display: 'flex',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '88px 24px 48px',
          gap: '32px',
        }}>
          <main style={{ flex: 1, minWidth: 0 }}>
            <Outlet />
          </main>
          {showSidebar && <Sidebar />}
        </div>
      )}

      {/* 页脚 — 首页的 footer 已放在 HomePage 滚动容器内 */}
      {!isHome && <SiteFooter simple />}
    </div>
  )
}
