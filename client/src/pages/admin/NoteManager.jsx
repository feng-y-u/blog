import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotes, createNote, updateNote, deleteNote, exportNote } from '../../api/note'
import AdminToast from '../../components/AdminToast'
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'

export default function NoteManager() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [validationError, setValidationError] = useState('')
  const fileRef = useRef(null)

  function load() {
    setLoading(true)
    getNotes({ limit: 100 })
      .then(res => { setNotes(res.data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.md')) {
      setToast({ type: 'error', text: '请上传 .md 文件' })
      return
    }
    const form = new FormData()
    form.append('file', file)
    try {
      await createNote(form)
      setToast({ type: 'success', text: '已上传 ' + file.name })
      load()
    } catch { setToast({ type: 'error', text: '上传失败' }) }
    e.target.value = ''
  }

  function selectNote(note) {
    setSelectedNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setValidationError('')
  }

  async function handleSave() {
    if (!editTitle.trim() || !editContent.trim()) {
      setValidationError('标题和内容不能为空')
      return
    }
    setValidationError('')
    try {
      await updateNote(selectedNote.id, { title: editTitle, content: editContent })
      setToast({ type: 'success', text: '已保存' })
      load()
      setSelectedNote(prev => ({ ...prev, title: editTitle, content: editContent }))
    } catch { setToast({ type: 'error', text: '保存失败' }) }
  }

  function handleConvertToPost(note) {
    sessionStorage.setItem('convert-note-title', note.title)
    sessionStorage.setItem('convert-note-content', note.content)
    navigate('/admin/posts/new')
  }

  async function handleExport(note) {
    try {
      const res = await exportNote(note.id)
      const blob = new Blob([res.data], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = note.title.replace(/[\\/:*?"<>|]/g, '_') + '.md'
      a.click()
      URL.revokeObjectURL(url)
    } catch { setToast({ type: 'error', text: '导出失败' }) }
  }

  if (loading) return <Loading />

  return (
    <div>
      <AdminToast message={toast?.text} type={toast?.type} onClose={() => setToast(null)} />
      <div className="admin-page-header">
        <h1 className="admin-page-title">笔记管理</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fileRef.current?.click()} className="admin-btn admin-btn-primary">📄 上传 .md</button>
          <input ref={fileRef} type="file" accept=".md" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="admin-empty">暂无笔记，点击"上传 .md"添加</p>
      ) : (
        <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 14rem)' }}>
          {/* Note list */}
          <div className="admin-card" style={{ width: '240px', flexShrink: 0, overflow: 'auto', padding: '8px', marginBottom: 0 }}>
            {notes.map(note => (
              <div key={note.id} onClick={() => selectNote(note)}
                style={{
                  padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '2px',
                  background: selectedNote?.id === note.id ? 'var(--accent-dim)' : 'transparent',
                  color: selectedNote?.id === note.id ? 'var(--accent)' : 'var(--fg-secondary)',
                  transition: 'background 0.1s',
                }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--fg)', marginBottom: '2px' }}>{note.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>{new Date(note.updatedAt).toLocaleDateString('zh-CN')}</div>
              </div>
            ))}
          </div>

          {/* Preview / Edit */}
          {selectedNote ? (
            <div className="admin-card" style={{ flex: 1, marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                placeholder="笔记标题"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '15px', fontWeight: 600, background: 'var(--bg)', color: 'var(--fg)', boxSizing: 'border-box', marginBottom: '12px' }} />
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                placeholder="笔记内容（Markdown）"
                style={{ flex: 1, padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'none', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box', outline: 'none', minHeight: '200px' }} />
              {validationError && (
                <p style={{ fontSize: '12px', color: 'var(--accent-pink)', marginTop: '4px' }}>{validationError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button onClick={handleSave} className="admin-btn admin-btn-primary">💾 保存</button>
                <button onClick={() => handleConvertToPost(selectedNote)} className="admin-btn" style={{ color: '#22c55e', borderColor: '#22c55e' }}>📤 转为文章</button>
                <button onClick={() => handleExport(selectedNote)} className="admin-btn" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>📥 导出 MD</button>
                <span style={{ flex: 1 }} />
                <button onClick={() => setConfirmDelete({ id: selectedNote.id })} className="admin-btn admin-btn-danger">🗑️ 删除</button>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ flex: 1, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)', fontSize: '14px' }}>
              点击左侧笔记查看详情
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="确认删除"
        message="确定删除此笔记？此操作不可撤销。"
        confirmText="删除"
        danger
        onConfirm={async () => {
          try {
            await deleteNote(confirmDelete.id)
            setToast({ type: 'success', text: '已删除' })
            if (selectedNote?.id === confirmDelete.id) setSelectedNote(null)
            load()
          } catch { setToast({ type: 'error', text: '删除失败' }) }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
