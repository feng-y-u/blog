import { useState, useEffect, useRef } from 'react'
import { getNotes, createNote, updateNote, deleteNote, exportNote } from '../../api/note'

export default function NoteManager() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [showUpload, setShowUpload] = useState(false)
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
    if (!file || !file.name.endsWith('.md')) return alert('请上传 .md 文件')
    const form = new FormData()
    form.append('file', file)
    try {
      await createNote(form)
      load()
      setShowUpload(false)
    } catch (err) { alert('上传失败') }
  }

  function handleEdit(note) {
    setEditing(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  async function handleSave() {
    if (!editTitle.trim() || !editContent.trim()) return alert('标题和内容不能为空')
    try {
      if (editing) {
        await updateNote(editing, { title: editTitle, content: editContent })
      }
      setEditing(null)
      load()
    } catch (err) { alert('保存失败') }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此笔记？')) return
    await deleteNote(id)
    load()
  }

  async function handleExport(id) {
    try {
      const res = await exportNote(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/markdown' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'note.md'; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { alert('导出失败') }
  }

  if (loading) return <div style={{ color: 'var(--fg-secondary)' }}>加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>笔记管理</h1>
        <button onClick={() => setShowUpload(!showUpload)} className="admin-btn admin-btn-primary">上传笔记</button>
      </div>

      {showUpload && (
        <div className="admin-card" style={{ border: '2px dashed var(--border)' }}>
          <p style={{ fontSize: '13px', color: 'var(--fg-secondary)', marginBottom: '12px' }}>选择 .md 文件上传</p>
          <input ref={fileRef} type="file" accept=".md" onChange={handleFileUpload} style={{ fontSize: '13px' }} />
        </div>
      )}

      {editing && (
        <div className="admin-card">
          <h2 className="admin-card-title">编辑笔记</h2>
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
            placeholder="笔记标题" className="admin-input" style={{ marginBottom: '8px' }} />
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            placeholder="笔记内容（Markdown）" rows={12}
            className="admin-textarea" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={handleSave} className="admin-btn admin-btn-primary">保存</button>
            <button onClick={() => setEditing(null)} className="admin-btn">取消</button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="admin-empty">暂无笔记，点击"上传笔记"添加</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(note => (
                <tr key={note.id}>
                  <td style={{ fontWeight: 500, color: 'var(--fg)' }}>{note.title}</td>
                  <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{note.category?.name || '-'}</td>
                  <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{new Date(note.updatedAt).toLocaleDateString('zh-CN')}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(note)} style={{ fontSize: '13px', color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>编辑</button>
                    <button onClick={() => handleExport(note.id)} style={{ fontSize: '13px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>导出</button>
                    <button onClick={() => handleDelete(note.id)} style={{ fontSize: '13px', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
