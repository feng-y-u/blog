import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getCategories, getTags } from '../api/posts'
import { getNotes } from '../api/note'

export default function Sidebar() {
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
    <aside className="flex flex-col gap-5" style={{ width: 'var(--sidebar-w)' }}>
      {/* 资料卡 */}
      <div className="rounded-xl p-6 text-center" style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}>
        <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl" style={{
          border: '3px solid var(--accent)',
          background: 'var(--surface)',
          color: 'var(--accent)',
        }}>
          🐱
        </div>
        <h3 className="text-xl font-bold" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          Yuki
        </h3>
        <p className="text-sm italic mt-1" style={{ color: 'var(--accent)' }}>
          写代码的宅
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--fg-secondary)' }}>
          前端/后端/动漫/游戏
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
          </a>
          <a href="mailto:yuki@example.com"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
          </a>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="rounded-xl p-4" style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Link to="/" className="block p-2 rounded-lg transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
            <div className="text-xl font-bold" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>{stats.posts}</div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>文章</div>
          </Link>
          <Link to="/notes" className="block p-2 rounded-lg transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
            <div className="text-xl font-bold" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>{stats.notes}</div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>笔记</div>
          </Link>
          <Link to="/categories" className="block p-2 rounded-lg transition-all hover:scale-105" style={{ background: 'var(--surface)' }}>
            <div className="text-xl font-bold" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>{stats.categories}</div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>分类</div>
          </Link>
        </div>
      </div>

      {/* 分类列表 */}
      {categories.length > 0 && (
        <div className="rounded-xl p-4" style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>分类</h4>
          <div className="flex flex-col gap-1.5">
            {categories.map(cat => (
              <Link key={cat.id} to={`/category/${cat.slug}`}
                className="flex justify-between items-center px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-[1.02]"
                style={{ color: 'var(--fg-secondary)', background: 'var(--surface)' }}>
                <span>{cat.name}</span>
                <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>{cat._count?.posts || 0}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 标签云 */}
      {tags.length > 0 && (
        <div className="rounded-xl p-4" style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
        }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>标签</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => {
              const size = (tag._count?.posts || 0) > 3 ? 'tag-lg' : (tag._count?.posts || 0) > 0 ? 'tag' : 'tag-sm'
              const sizes = { 'tag-lg': 'text-sm px-3 py-1.5', 'tag': 'text-xs px-2.5 py-1', 'tag-sm': 'text-[11px] px-2 py-0.5' }
              return (
                <Link key={tag.id} to={`/tag/${tag.slug}`}
                  className={`${sizes[size]} rounded-full transition-all hover:scale-105`}
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    border: '1px solid transparent',
                  }}>
                  {tag.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}
