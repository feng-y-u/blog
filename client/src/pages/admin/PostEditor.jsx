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
  const [jpChar, setJpChar] = useState('')
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
      setJpChar(post.jpChar || '')
      setCategoryId(post.categoryId || '')
      setSelectedTags(post.tags?.map(t => t.id) || [])
    })
  }, [id, isEdit])

  async function handleSave(status) {
    const data = { title, content, excerpt, coverImage, jpChar: jpChar || null, status, categoryId: categoryId || null, tagIds: selectedTags }
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
      <h1 className="admin-page-title">{isEdit ? '编辑文章' : '写文章'}</h1>
      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 12rem)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题"
            style={{ width: '100%', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '18px', fontWeight: 600, background: 'var(--card)', color: 'var(--fg)', boxSizing: 'border-box' }} />
          {/* 工具栏 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <button onClick={() => document.getElementById('image-input').click()} disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', opacity: uploading ? 0.5 : 1, fontFamily: 'var(--font-body)' }}
              title="插入图片">
              {uploading ? (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              )}
              {uploading ? '上传中...' : '图片'}
            </button>
            <input id="image-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>
          <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
            placeholder="正文（Markdown）"
            style={{ flex: 1, width: '100%', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleSave('draft')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              保存草稿
            </button>
            <button onClick={() => handleSave('published')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              发布
            </button>
          </div>
        </div>
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
              <option value="">无分类</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--fg)' }}>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  style={{
                    fontSize: '12px', padding: '4px 8px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'var(--font-body)', border: '1px solid var(--border)',
                    background: selectedTags.includes(tag.id) ? 'var(--accent)' : 'var(--surface)',
                    color: selectedTags.includes(tag.id) ? '#fff' : 'var(--fg-secondary)',
                  }}>{tag.name}</button>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>封面图 URL</label>
            <input type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box' }} />
            {coverImage && (
              <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <img src={coverImage} alt="封面预览" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block' }}
                />
                <div style={{ display: 'none', padding: '16px', fontSize: '12px', color: 'var(--fg-muted)', textAlign: 'center' }}>图片加载失败</div>
              </div>
            )}
          </div>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>杂志装饰字</label>
            <input type="text" value={jpChar} onChange={e => setJpChar(e.target.value.slice(0, 2))} placeholder="默认 → 按分类自动"
              maxLength={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box' }} />
            <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--fg-muted)' }}>日文汉字，1-2 字符，显示在杂志跨页右侧</p>
          </div>
        </div>
      </div>
    </div>
  )
}
