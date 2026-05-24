import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories, getTags } from '../api/posts'
import { getNotes } from '../api/note'
import { useSettings } from '../contexts/SettingsContext'
import avatarImg from '../assets/avatar.jpg'

const SOCIAL_ICONS = {
  github: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  bilibili: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><ellipse cx="6.5" cy="6" rx="3.2" ry="3.8"/><ellipse cx="17.5" cy="6" rx="3.2" ry="3.8"/><rect x="2" y="5" width="20" height="16" rx="4"/><path d="M10 9.5v6l5-3-5-3z"/></svg>,
  twitter: '✕', zenn: '◇', qiita: '○',
  weibo: '◎', email: '✉', website: '◎',
}

export default function Sidebar() {
  const { settings } = useSettings()
  const profileName = '风予'
  let socialLinks = {}
  try { socialLinks = settings?.social_links ? JSON.parse(settings.social_links) : {} } catch { socialLinks = {} }
  const socialEntries = Object.entries(socialLinks)
  const [stats, setStats] = useState({ posts: '-', notes: '-', categories: '-' })
  const [tags, setTags] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    Promise.all([
      getPosts({ limit: 1 }),
      getNotes({ limit: 1 }),
      getCategories(),
      getTags(),
    ]).then(([postsRes, notesRes, catRes, tagRes]) => {
      setStats({
        posts: postsRes.data.pagination.total,
        notes: notesRes.data.pagination.total,
        categories: catRes.data.data.length,
      })
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    }).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col gap-5" style={{ width: 'var(--sidebar-w)' }}>
      {/* 资料卡 */}
      <div className="sidebar-card" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '28px 24px',
        boxShadow: 'var(--shadow)',
        transition: 'var(--transition)',
      }}>
        <div className="profile" style={{ textAlign: 'center' }}>
          {/* 头像 */}
          <div style={{
            width: '88px', height: '88px',
            borderRadius: '50%',
            margin: '0 auto 16px',
            border: '2px solid var(--border)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img src={avatarImg} alt={profileName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div className="profile-name" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--fg)',
            letterSpacing: '0.02em',
          }}>
            {profileName}
          </div>
          <div className="social-links" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '14px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}>
            {socialEntries.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={key}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--fg-secondary)', border: '1px solid var(--border)',
                  textDecoration: 'none', fontSize: '16px',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}>
                {SOCIAL_ICONS[key] || '◎'}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 导航统计 */}
      <div className="sidebar-card" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow)',
        transition: 'var(--transition)',
      }}>
        <div className="sidebar-section-title" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--fg-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '12px',
        }}>
          导航
        </div>
        <div className="nav-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
        }}>
          {[
            { to: '/', label: '文章', key: 'posts' },
            { to: '/notes', label: '笔记', key: 'notes' },
            { to: '/categories', label: '分类', key: 'categories' },
          ].map(({ to, label, key }) => (
            <Link key={key} to={to} className="nav-stat" style={{
              textAlign: 'center', padding: '10px 4px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg)', cursor: 'pointer',
              transition: 'var(--transition)', textDecoration: 'none', color: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div className="nav-stat-num" style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px', fontWeight: 700, color: 'var(--fg)',
              }}>{stats[key]}</div>
              <div className="nav-stat-label" style={{ fontSize: '11px', color: 'var(--fg-secondary)', marginTop: '2px' }}>{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* 分类列表 */}
      {categories.length > 0 && (
        <div className="sidebar-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow)',
          transition: 'var(--transition)',
        }}>
          <div className="sidebar-section-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}>
            分类
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="tag" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                  color: 'var(--fg-secondary)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'var(--transition)', textDecoration: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' }}>
                <span>{cat.name}</span>
                <span style={{ color: 'var(--fg-muted)', fontSize: '11px' }}>{cat._count?.posts || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 标签云 */}
      {tags.length > 0 && (
        <div className="sidebar-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow)',
          transition: 'var(--transition)',
        }}>
          <div className="sidebar-section-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fg-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}>
            热门标签
          </div>
          <div className="tag-cloud" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map((tag, i) => {
              const count = tag._count?.posts || 0
              const sizeClass = count > 3 ? 'tag-lg' : count > 0 ? 'tag' : 'tag-sm'
              const sizes = { 'tag-lg': { fontSize: '13px', padding: '4px 14px' }, 'tag': { fontSize: '11px', padding: '3px 10px' }, 'tag-sm': { fontSize: '10px', padding: '2px 8px' } }
              const s = sizes[sizeClass]
              return (
                <Link key={tag.id} to={`/tag/${tag.slug}`}
                  className="tag" style={{
                    display: 'inline-block',
                    ...s,
                    borderRadius: '20px',
                    color: 'var(--fg-secondary)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' }}>
                  {tag.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
