import { useState, useEffect } from 'react'
import { getPublicNotes } from '../api/note'
import Loading from '../components/Loading'
import { formatTime } from '../utils/date'

function stripMarkdown(text) {
  return text.replace(/[#*`\[\]()>|\\-]/g, '').replace(/\n{2,}/g, '\n').trim()
}

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    getPublicNotes({ page, limit: 20 })
      .then(res => {
        setNotes(res.data.data)
        setTotalPages(res.data.pagination.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="page-title">笔记</h1>
      {notes.length === 0 ? (
        <p className="loading">暂无笔记</p>
      ) : (
        <div className="notes-grid">
          {notes.map(note => (
            <div key={note.slug} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{note.title}</h2>
              <p style={{
                fontSize: '13px', color: 'var(--fg-secondary)', lineHeight: 1.7,
                flex: 1, marginBottom: '16px',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {stripMarkdown(note.content).slice(0, 120)}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '12px', color: 'var(--fg-muted)',
                borderTop: '1px solid var(--border)', paddingTop: '12px',
              }}>
                {note.category && <span style={{ color: 'var(--accent-pink)', fontWeight: 500 }}>{note.category.name}</span>}
                <span>{formatTime(note.updatedAt)}</span>
                <span style={{ marginLeft: 'auto', fontSize: '14px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`pagination-btn${page === p ? ' active' : ''}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
