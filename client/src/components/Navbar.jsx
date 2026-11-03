import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || 'light'
  }
  return 'light'
}

export default function Navbar({ onSearchOpen }) {
  const { settings } = useSettings()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isPostPage = location.pathname.startsWith('/post/')
  const [theme, setTheme] = useState(getInitialTheme)
  const [scrolled, setScrolled] = useState(false)
  const siteTitle = settings?.site_title || "风予'S BLOG"

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('blog-theme', theme)
  }, [theme])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '56px',
      background: isHome || scrolled ? 'var(--nav-bg)' : 'transparent',
      backdropFilter: isHome || scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: isHome || scrolled ? 'blur(12px)' : 'none',
      borderBottom: isHome || scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'var(--transition)',
    }}>
      {/* 左侧 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isPostPage && (
          <Link to="/" style={{
            fontSize: '13px', color: 'var(--fg-secondary)', textDecoration: 'none',
            marginRight: '4px', transition: 'var(--transition)',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)' }}>
            ← Back
          </Link>
        )}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          textDecoration: 'none',
        }}>
          {/* 首页的站名由首屏粒子交接过来，所以整条首页路由都先藏着：
              只看 --splash-p，不依赖 HomeSplash 是否已挂载，避免加载态闪一下。 */}
          <span className={`nav-brand-mark${isHome ? ' is-home' : ''}`} style={{ color: 'var(--accent-pink)', fontSize: '16px' }}>✦</span>
          <span className={`nav-brand-text${isHome ? ' is-home' : ''}`} style={{
            color: 'var(--fg)', fontSize: '13px',
            letterSpacing: '0.15em', fontWeight: 800,
            fontFamily: "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
          }}>
            {siteTitle}
          </span>
        </Link>
      </div>

      {/* 右侧 */}
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {!isPostPage && (
          <>
            <NavLink to="/" active={location.pathname === '/'}>文章</NavLink>
            <NavLink to="/categories" active={location.pathname.startsWith('/categor') || location.pathname.startsWith('/tag')}>索引</NavLink>
            <NavLink to="/archives" active={location.pathname.startsWith('/archives')}>归档</NavLink>
          </>
        )}
        <button
          onClick={onSearchOpen}
          style={{
            background: 'none', border: 'none',
            color: 'var(--fg-muted)', cursor: 'pointer',
            fontSize: '18px', padding: '4px',
            transition: 'var(--transition)',
            lineHeight: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)' }}
          aria-label="搜索"
        >
          ⌕
        </button>
        <button
          onClick={toggleTheme}
          style={{
            background: 'none', border: 'none',
            color: 'var(--fg-muted)', cursor: 'pointer',
            width: '22px', height: '22px', padding: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--transition)',
            lineHeight: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)' }}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到暗色模式'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </nav>
  )
}

// 主题图标用矢量线稿：emoji 会被系统画成彩色位图，永远跟不了 currentColor
const ICON = {
  viewBox: '0 0 24 24',
  width: 16,
  height: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

function SunIcon() {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...ICON}>
      <path d="M20.5 14.2A8.6 8.6 0 1 1 9.8 3.5a6.9 6.9 0 0 0 10.7 10.7z" />
    </svg>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className="nav-link" style={{
      display: 'inline-block',
      fontSize: '12px', fontWeight: active ? 700 : 500,
      color: active ? 'var(--accent-pink)' : 'var(--fg-muted)',
      textDecoration: 'none',
      letterSpacing: '0.04em',
      transition: 'var(--transition)',
      borderBottom: active ? '2px solid var(--accent-pink)' : '1px solid transparent',
      paddingBottom: '2px',
      transform: active ? 'translateY(-2px) scale(1.15)' : 'none',
      boxShadow: active ? '0 6px 16px var(--accent-glow)' : 'none',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--fg-secondary)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--fg-muted)' } }}>
      {children}
    </Link>
  )
}
