import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, createPost, updatePost, getCategories, getTags } from '../../api/posts'
import { uploadImage } from '../../api/upload'

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const textareaRef = useRef(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getPost(id).then(res => {
      const post = res.data.data
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.coverImage || '')
      setCategoryId(post.categoryId || '')
      setSelectedTags(post.tags?.map(t => t.id) || [])
    })
  }, [id, isEdit])

  async function handleSave(status) {
    const data = { title, content, excerpt, coverImage, status, categoryId: categoryId || null, tagIds: selectedTags }
    try {
      if (isEdit) {
        await updatePost(id, data)
      } else {
        await createPost(data)
      }
      navigate('/admin/posts')
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message))
    }
  }

  function toggleTag(tagId) {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      const url = res.data.data.url
      const ta = textareaRef.current
      if (ta) {
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const imgMarkdown = `\n![图片](${url})\n`
        setContent(prev => prev.substring(0, start) + imgMarkdown + prev.substring(end))
        setTimeout(() => {
          ta.focus()
          ta.selectionStart = ta.selectionEnd = start + imgMarkdown.length
        }, 0)
      } else {
        setContent(prev => prev + `\n![图片](${url})\n`)
      }
    } catch (err) {
      alert('上传失败: ' + (err.response?.data?.error || err.message))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? '编辑文章' : '写文章'}</h1>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <div className="flex-1 flex flex-col gap-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题"
            className="w-full px-4 py-2 border rounded text-lg font-semibold"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
          {/* 工具栏 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-t" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <button onClick={() => document.getElementById('image-input').click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}
              title="插入图片">
              {uploading ? (
                <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              )}
              {uploading ? '上传中...' : '图片'}
            </button>
            <input id="image-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageUpload} />
          </div>
          <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
            placeholder="正文（Markdown）"
            className="flex-1 w-full p-4 font-mono text-sm resize-none rounded-b"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
          <div className="flex gap-2">
            <button onClick={() => handleSave('draft')}
              className="px-4 py-2 rounded-lg transition-all"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
              保存草稿
            </button>
            <button onClick={() => handleSave('published')}
              className="px-4 py-2 rounded-lg text-white transition-all"
              style={{ background: 'var(--accent)' }}>
              发布
            </button>
          </div>
        </div>
        <div className="w-80 flex flex-col gap-4">
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--fg)' }}>分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
              <option value="">无分类</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  className="text-xs px-2 py-1 rounded-full transition-all"
                  style={{
                    background: selectedTags.includes(tag.id) ? 'var(--accent)' : 'var(--surface)',
                    color: selectedTags.includes(tag.id) ? '#fff' : 'var(--fg-secondary)',
                    border: '1px solid var(--border)',
                  }}>{tag.name}</button>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--fg)' }}>封面图 URL</label>
            <input type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2 rounded text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
