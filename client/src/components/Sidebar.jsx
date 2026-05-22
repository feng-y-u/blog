import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories, getTags } from '../api/posts'
import { getNotes } from '../api/note'
import { useSettings } from '../contexts/SettingsContext'

const SOCIAL_ICONS = {
  github: '⌂', twitter: '✕', zenn: '◇', qiita: '○',
  bilibili: '▶', weibo: '◎', email: '✉', website: '◎',
}

export default function Sidebar() {
  const { settings } = useSettings()
  const avatarEmoji = settings?.avatar_emoji || '🌸'
  const profileName = settings?.profile_name || 'Yuki'
  const profileSig = settings?.profile_signature || '― コードは詩、アニメは夢 ―'
  const profileBio = settings?.profile_bio || '全栈开发者 / 动漫爱好者 / 开源贡献者'
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
          {/* 头像 — 渐变边框效果，与原型一致 */}
          <div style={{
            width: '88px', height: '88px',
            borderRadius: '50%',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent-dim), rgba(100, 80, 200, 0.2))',
            border: '2px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* 渐变边框遮罩 */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid transparent',
              background: 'linear-gradient(135deg, var(--accent), rgba(100, 80, 200, 0.4)) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }} />
            {avatarEmoji}
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
          <div className="profile-sig" style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontStyle: 'italic',
            fontSize: '14px',
            color: 'var(--accent)',
            marginTop: '6px',
            opacity: 0.9,
          }}>
            {profileSig}
          </div>
          <div className="profile-bio" style={{
            fontSize: '13px',
            color: 'var(--fg-secondary)',
            marginTop: '10px',
            lineHeight: 1.5,
          }}>
            {profileBio.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
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
