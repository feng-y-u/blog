import { useState, useEffect } from 'react'

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || 'dark'
  }
  return 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('blog-theme', theme)
  }, [theme])

  function toggle() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <button
      onClick={toggle}
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 100,
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--fg)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        transition: 'var(--transition)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.boxShadow = '0 0 16px var(--accent-glow)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <span id="themeIcon">{theme === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  )
}
