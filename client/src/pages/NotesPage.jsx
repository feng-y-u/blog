import { useState, useEffect } from 'react'
import client from '../api/client'
import Loading from '../components/Loading'
import { formatDate } from '../utils/date'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    client.get('/notes/public', { params: { page, limit: 20 } })
      .then(res => {
        setNotes(res.data.data)
        setTotalPages(res.data.pagination.totalPages)
      })
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">笔记</h1>
      {notes.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无笔记</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map(note => (
            <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold mb-2">{note.title}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {note.category && <span className="text-blue-600 font-medium">{note.category.name}</span>}
                <span>{formatDate(note.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${page === p ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
