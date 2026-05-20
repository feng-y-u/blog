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

  if (loading) return <div className="text-gray-500">加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">笔记管理</h1>
        <button onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          上传笔记
        </button>
      </div>

      {showUpload && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-sm text-gray-500 mb-3">选择 .md 文件上传</p>
          <input ref={fileRef} type="file" accept=".md" onChange={handleFileUpload} className="text-sm" />
        </div>
      )}

      {editing && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h2 className="font-semibold mb-3">编辑笔记</h2>
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
            placeholder="笔记标题" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 mb-2" />
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
            placeholder="笔记内容（Markdown）" rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono text-sm resize-y" />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">保存</button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded text-sm">取消</button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无笔记，点击"上传笔记"添加</p>
      ) : (
        <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3">标题</th>
              <th className="text-left p-3">分类</th>
              <th className="text-left p-3">更新时间</th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {notes.map(note => (
              <tr key={note.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3 font-medium">{note.title}</td>
                <td className="p-3 text-sm text-gray-500">{note.category?.name || '-'}</td>
                <td className="p-3 text-sm text-gray-500">{new Date(note.updatedAt).toLocaleDateString('zh-CN')}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(note)} className="text-sm text-green-600 hover:underline">编辑</button>
                  <button onClick={() => handleExport(note.id)} className="text-sm text-blue-600 hover:underline">导出</button>
                  <button onClick={() => handleDelete(note.id)} className="text-sm text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
