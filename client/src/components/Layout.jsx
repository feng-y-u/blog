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
      <ThemeToggle />

      {/* Banner */}
      <Banner />

      {/* 主内容区：两栏布局 — 与原型一致 margin-top: -40px, z-index: 3 */}
      <div style={{
        display: 'flex',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        gap: '32px',
        position: 'relative',
        marginTop: '-40px',
        zIndex: 3,
      }}>
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
        {showSidebar && (
          <aside className="sidebar" style={{
            width: 'var(--sidebar-w)',
            flexShrink: 0,
            position: 'sticky',
            top: '24px',
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 48px)',
            overflowY: 'auto',
          }}>
            <Sidebar />
          </aside>
        )}
      </div>

      {/* 页脚 — 与原型一致 */}
      <footer className="footer" style={{
        textAlign: 'center',
        padding: '32px 24px 48px',
        color: 'var(--fg-muted)',
        fontSize: '13px',
        borderTop: '1px solid var(--border)',
        marginTop: '20px',
      }}>
        &copy; {new Date().getFullYear()} Yuki's Blog. Built with ❤ &nbsp;|&nbsp; Powered by コードとアニメ<br />
        <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', margin: '0 4px' }}>首页</Link>
        {' · '}
        <a href="/api/feed" style={{ color: 'var(--accent)', textDecoration: 'none', margin: '0 4px' }}>RSS 订阅</a>
        {' · '}
        <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', margin: '0 4px' }}>关于</a>
        {' · '}
        <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', margin: '0 4px' }}>友情链接</a>
      </footer>
    </div>
  )
}
