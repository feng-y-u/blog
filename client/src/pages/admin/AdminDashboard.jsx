import { useState, useEffect } from 'react'
import { getPosts } from '../../api/posts'
import { getCategories } from '../../api/categories'
import { getTags } from '../../api/tags'
import { getComments } from '../../api/comments'
import { getNotes } from '../../api/note'
import Loading from '../../components/Loading'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ posts: '-', categories: '-', tags: '-', comments: '-', pendingComments: '-', notes: '-' })
  const [recentComments, setRecentComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPosts({ limit: 1 }),
      getCategories(),
      getTags(),
      getComments({ limit: 1 }),
      getComments({ limit: 5, status: 'pending' }),
      getNotes({ limit: 1 }),
    ]).then(([postsRes, catRes, tagRes, commentsRes, pendingRes, notesRes]) => {
      setStats({
        posts: postsRes.data.pagination.total,
        categories: catRes.data.data.length,
        tags: tagRes.data.data.length,
        comments: commentsRes.data.pagination.total,
        pendingComments: pendingRes.data.pagination.total,
        notes: notesRes.data.pagination.total,
      })
      setRecentComments(pendingRes.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="admin-page-title">仪表盘</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="文章总数" value={stats.posts} />
        <StatCard label="分类数" value={stats.categories} />
        <StatCard label="标签数" value={stats.tags} />
        <StatCard label="评论总数" value={stats.comments} />
        <StatCard label="待审核评论" value={stats.pendingComments} highlight />
        <StatCard label="笔记总数" value={stats.notes} />
      </div>

      {recentComments.length > 0 && (
        <div className="admin-card">
          <h2 className="admin-card-title">待审核评论</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentComments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {c.authorName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--fg)' }}>{c.authorName}</div>
                  <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                  <p style={{ fontSize: '12px', color: 'var(--fg-muted)', marginTop: '2px' }}>on {c.post?.title || '未知文章'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="admin-card" style={highlight ? { borderColor: 'var(--accent-pink)' } : {}}>
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--fg)' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{label}</div>
    </div>
  )
}
