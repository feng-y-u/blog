import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { getPost, createPost, updatePost, getCategories, getTags } from '../../api/posts'
import { uploadImage } from '../../api/upload'
import AdminToast from '../../components/AdminToast'

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const editor = useCreateBlockNote({
    uploadFile: async (file) => {
      if (!file.type.startsWith('image/')) return ''
      const res = await uploadImage(file)
      return res.data.data.url
    },
  })
  const loadingRef = useRef(false)

  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [jpChar, setJpChar] = useState('')
  const [categoryId, setCategoryId] = useState('5')
  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const mdFileRef = useRef(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    })
    // Check for note conversion pre-fill from sessionStorage
    const noteContent = sessionStorage.getItem('convert-note-content')
    if (noteContent && !isEdit) {
      const noteTitle = sessionStorage.getItem('convert-note-title') || ''
      if (noteTitle) setTitle(noteTitle)
      sessionStorage.removeItem('convert-note-title')
      sessionStorage.removeItem('convert-note-content')
      if (editor) {
        editor.tryParseMarkdownToBlocks(noteContent).then(blocks => {
          editor.replaceBlocks(editor.document, blocks)
        })
      }
    }
  }, [])

  useEffect(() => {
    if (!isEdit) { setLoading(false); return }
    getPost(id).then(async res => {
      const post = res.data.data
      setTitle(post.title)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.coverImage || '')
      setJpChar(post.jpChar || '')
      setCategoryId(String(post.categoryId || '5'))
      setSelectedTags(post.tags?.map(t => t.id) || [])
      if (post.content && editor) {
        const blocks = await editor.tryParseMarkdownToBlocks(post.content)
        editor.replaceBlocks(editor.document, blocks)
      }
    }).catch(() => setToast({ type: 'error', text: '加载文章失败' }))
      .finally(() => setLoading(false))
  }, [id, isEdit, editor])

  // Auto-default jpChar to "其他" when no category selected
  useEffect(() => {
    if (!categoryId && !jpChar) {
      setJpChar('其他')
    }
  }, [categoryId])

  async function handleSave(status) {
    const content = await editor.blocksToMarkdownLossy()
    const data = {
      title, content, excerpt, coverImage,
      jpChar: jpChar || null,
      status,
      categoryId: categoryId || null,
      tagIds: selectedTags,
    }
    try {
      if (isEdit) {
        await updatePost(id, data)
        setToast({ type: 'success', text: '已保存' })
      } else {
        await createPost(data)
        setToast({ type: 'success', text: '已发布' })
        navigate('/admin/posts')
      }
    } catch (err) {
      setToast({ type: 'error', text: '保存失败: ' + (err.response?.data?.error || err.message) })
    }
  }

  const saveDraft = useCallback(() => handleSave('draft'), [title, excerpt, coverImage, jpChar, categoryId, selectedTags, isEdit, id, navigate, editor])

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!loadingRef.current) {
          loadingRef.current = true
          saveDraft().finally(() => { loadingRef.current = false })
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [saveDraft])

  function toggleTag(tagId) {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
  }

  async function handleMdUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !file.name.endsWith('.md')) {
      setToast({ type: 'error', text: '请上传 .md 文件' })
      return
    }
    const text = await file.text()
    const titleMatch = text.match(/^#\s+(.+)/m)
    if (titleMatch && !title) setTitle(titleMatch[1].trim())
    if (editor) {
      const blocks = await editor.tryParseMarkdownToBlocks(text)
      editor.insertBlocks(blocks, editor.document[editor.document.length - 1], 'after')
    }
    e.target.value = ''
    setToast({ type: 'success', text: '已导入 ' + file.name })
  }

  if (loading) {
    return (
      <div>
        <h1 className="admin-page-title">{isEdit ? '编辑文章' : '写文章'}</h1>
        <div className="loading">
          <div className="skeleton-card">
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line skeleton-line-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminToast message={toast?.text} type={toast?.type} onClose={() => setToast(null)} />
      <h1 className="admin-page-title">{isEdit ? '编辑文章' : '写文章'}</h1>

      <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 12rem)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题"
            style={{ width: '100%', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '18px', fontWeight: 600, background: 'var(--card)', color: 'var(--fg)', boxSizing: 'border-box' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <button onClick={() => mdFileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              上传 .md
            </button>
            <input ref={mdFileRef} type="file" accept=".md" style={{ display: 'none' }} onChange={handleMdUpload} />
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>支持 / 命令插入块 · 拖拽图片上传</span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}>
            <BlockNoteView editor={editor} theme="light" style={{ height: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveDraft}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              保存草稿
            </button>
            <button onClick={() => handleSave('published')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}>
              发布
            </button>
            <span style={{ fontSize: '12px', color: 'var(--fg-muted)', alignSelf: 'center', marginLeft: '8px' }}>Ctrl+S 保存草稿</span>
          </div>
        </div>

        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
          <div className="admin-card">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
              <option value="5">其他</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="admin-card">
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
          <div className="admin-card">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--fg)' }}>封面图</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {coverImage ? (
                <div style={{ borderRadius: '8px', overflow: 'hidden', height: '140px', background: 'var(--surface)', border: '1px solid var(--border)', position: 'relative' }}>
                  <img src={coverImage} alt="封面预览" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block' }}
                  />
                  <div style={{ display: 'none', padding: '32px 16px', fontSize: '12px', color: 'var(--fg-muted)', textAlign: 'center' }}>图片加载失败</div>
                  <button onClick={() => setCoverImage('')}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    删除
                  </button>
                </div>
              ) : (
                <div onClick={() => coverInputRef.current?.click()}
                  style={{ borderRadius: '8px', height: '100px', background: 'var(--surface)', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  点击上传封面图
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const res = await uploadImage(file)
                  setCoverImage(res.data.data.url)
                } catch { setToast({ type: 'error', text: '封面上传失败' }) }
                e.target.value = ''
              }} />
            </div>
          </div>
          <div className="admin-card">
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--fg)' }}>杂志装饰字</label>
            <input type="text" value={jpChar} onChange={e => setJpChar(e.target.value)} placeholder="默认 → 按分类自动"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box' }} />
            <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--fg-muted)' }}>日文汉字，1-2 字符，显示在杂志跨页右侧</p>
          </div>
        </div>
      </div>
    </div>
  )
}
