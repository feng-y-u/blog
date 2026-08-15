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
    <nav style={{
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
          <span style={{ color: 'var(--accent-pink)', fontSize: '16px' }}>✦</span>
          <span style={{
            color: 'var(--fg)', fontSize: '13px',
            letterSpacing: '0.15em', fontWeight: 800,
            fontFamily: "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
          }}>
            {siteTitle}
          </span>
        </Link>
      </div>

      {/* 右侧 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
            fontSize: '16px', padding: '4px',
            transition: 'var(--transition)',
            lineHeight: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)' }}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到暗色模式'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
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
