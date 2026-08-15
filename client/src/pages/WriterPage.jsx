import { useState, useEffect, useRef, useCallback } from 'react'
import {
  pickContentDir, restoreContentDir, ensureWritePermission,
  listMarkdownFiles, readTextFile, writeTextFile, copyImageTo,
} from '../utils/file-system'
import { parseFrontmatter, stringifyFrontmatter } from '../utils/frontmatter'
import { slugify } from '../utils/slugify'
import WriterToolbar from '../components/writer/WriterToolbar'
import WriterMetaForm from '../components/writer/WriterMetaForm'
import WriterPreview from '../components/writer/WriterPreview'
import '../styles/writer.css'

const TODAY = new Date().toISOString().slice(0, 10)

function emptyForm() {
  return {
    isNew: true, name: '', slug: '', title: '', date: TODAY,
    category: '', tags: [], jpChar: '', coverImage: '', excerpt: '', content: '',
    extra: {}, order: [],
  }
}

function deriveSlug(form) {
  return slugify(form.slug || form.title)
}

export default function WriterPage() {
  const [dir, setDir] = useState(null)
  const [permissionNeeded, setPermissionNeeded] = useState(false)
  const [articles, setArticles] = useState([])
  const [current, setCurrent] = useState(emptyForm)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [catTags, setCatTags] = useState({ categories: [], tags: [] })
  const coverInputRef = useRef(null)
  const textareaRef = useRef(null)

  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  // restore persisted dir handle on mount
  useEffect(() => {
    if (!supported) return
    restoreContentDir().then(async handle => {
      if (!handle) return
      if (await ensureWritePermission(handle)) {
        setDir(handle)
        loadArticles(handle)
      } else {
        setPermissionNeeded(true)
      }
    })
  }, [supported])

  // warn before closing with unsaved changes
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // paste image -> insert into content
  useEffect(() => {
    if (!supported) return
    function onPaste(e) {
      if (!dir) return
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))
      if (!item) return
      e.preventDefault()
      const file = item.getAsFile()
      if (file) insertImage(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [dir, supported]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadArticles = useCallback(async handle => {
    const names = await listMarkdownFiles(handle)
    const items = []
    const catSet = new Set()
    const tagSet = new Set()
    for (const name of names) {
      try {
        const raw = await readTextFile(handle, name)
        const { data } = parseFrontmatter(raw)
        if (data.category) catSet.add(String(data.category))
        ;(Array.isArray(data.tags) ? data.tags : []).forEach(t => tagSet.add(String(t)))
        items.push({ name, title: data.title || name.replace(/\.md$/, ''), category: data.category || '', tags: data.tags || [] })
      } catch {
        items.push({ name, title: name.replace(/\.md$/, ''), category: '', tags: [] })
      }
    }
    setArticles(items)
    setCatTags({
      categories: [...catSet].sort().map(name => ({ name, slug: slugify(name) })),
      tags: [...tagSet].sort().map(name => ({ name, slug: slugify(name) })),
    })
  }, [])

  async function handleOpenDir() {
    try {
      const handle = await pickContentDir()
      if (!(await ensureWritePermission(handle))) { setPermissionNeeded(true); return }
      setPermissionNeeded(false)
      setDir(handle)
      await loadArticles(handle)
    } catch (err) {
      if (err?.name !== 'AbortError') setToast('无法打开目录: ' + err.message)
    }
  }

  async function handleReauthorize() {
    if (!dir) { await handleOpenDir(); return }
    if (await ensureWritePermission(dir)) { setPermissionNeeded(false); await loadArticles(dir) }
  }

  function onField(key, value) {
    setCurrent(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSelect(name) {
    if (dirty && !window.confirm('当前有未保存的更改，确定放弃并打开其他文章？')) return
    try {
      const raw = await readTextFile(dir, name)
      const { data, order, content } = parseFrontmatter(raw)
      const base = name.replace(/\.md$/, '')
      const datePrefix = base.match(/^(\d{4}-\d{2}-\d{2})[-_]/)?.[1] || ''
      const slug = datePrefix ? base.slice(datePrefix.length + 1) : base
      setCurrent({
        isNew: false, name, slug, title: data.title || '', date: datePrefix || TODAY,
        category: data.category || '', tags: data.tags || [], jpChar: data.jpChar || '',
        coverImage: data.coverImage || '', excerpt: data.excerpt || '', content,
        extra: data, order,
      })
      setDirty(false)
    } catch (err) {
      setToast('打开文章失败: ' + err.message)
    }
  }

  function handleNew() {
    if (dirty && !window.confirm('当前有未保存的更改，确定新建文章？')) return
    setCurrent(emptyForm())
    setDirty(false)
  }

  async function handleImportMd(file) {
    try {
      const text = await file.text()
      const { data, order, content } = parseFrontmatter(text)
      if (dirty && !window.confirm('当前有未保存的更改，确定导入并覆盖编辑器？')) return
      setCurrent({
        isNew: true, name: '', slug: slugify(data.title || file.name.replace(/\.md$/, '')),
        title: data.title || '', date: data.date || TODAY,
        category: data.category || '', tags: data.tags || [], jpChar: data.jpChar || '',
        coverImage: data.coverImage || '', excerpt: data.excerpt || '', content,
        extra: data, order,
      })
      setDirty(true)
    } catch (err) {
      setToast('导入失败: ' + err.message)
    }
  }

  async function handleSave() {
    if (!dir) { setToast('请先打开 content 目录'); return }
    const form = current
    const title = form.title.trim() || form.slug || 'untitled'
    const slug = deriveSlug(form)
    let name = form.name
    if (form.isNew) {
      const dateSafe = /^\d{4}-\d{2}-\d{2}$/.test(form.date) ? form.date : TODAY
      name = `${dateSafe}-${slug}.md`
      let exists = true
      try {
        await dir.getFileHandle(name)
      } catch (err) {
        if (err?.name === 'NotFoundError') exists = false
        else throw err
      }
      if (exists) {
        if (!window.confirm(`文件 ${name} 已存在，覆盖？`)) return
      }
    }
    const data = { ...form.extra, title }
    if (form.category) data.category = form.category; else delete data.category
    if (form.tags.length) data.tags = form.tags; else delete data.tags
    if (form.coverImage) data.coverImage = form.coverImage; else delete data.coverImage
    if (form.excerpt) data.excerpt = form.excerpt; else delete data.excerpt
    if (form.jpChar) data.jpChar = form.jpChar; else delete data.jpChar
    // Note: existing `date` in form.extra stays untouched for edited files;
    // new files omit `date` entirely (the filename prefix carries it).
    const keys = ['title', ...(form.category ? ['category'] : []), ...(form.tags.length ? ['tags'] : []), ...(form.coverImage ? ['coverImage'] : []), ...(form.excerpt ? ['excerpt'] : []), ...(form.jpChar ? ['jpChar'] : [])]
    const order = form.isNew ? keys : [...new Set([...form.order, ...keys])]
    const text = stringifyFrontmatter(data, order) + (form.content || '')
    setSaving(true)
    try {
      await writeTextFile(dir, name, text)
      setCurrent(prev => ({ ...prev, isNew: false, name }))
      setDirty(false)
      setToast(`已保存 ${name}`)
      await loadArticles(dir)
    } catch (err) {
      setToast('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function insertImage(file) {
    if (!dir) { setToast('请先打开 content 目录'); return }
    try {
      const url = await copyImageTo(dir, file)
      const alt = decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '')
      const snippet = `![${alt}](${url})`
      const ta = textareaRef.current
      if (ta) {
        const start = ta.selectionStart ?? ta.value.length
        const end = ta.selectionEnd ?? start
        setCurrent(prev => {
          const next = prev.content.slice(0, start) + snippet + prev.content.slice(end)
          return { ...prev, content: next }
        })
        setDirty(true)
        requestAnimationFrame(() => {
          ta.focus()
          ta.selectionStart = ta.selectionEnd = start + snippet.length
        })
      } else {
        setCurrent(prev => ({ ...prev, content: prev.content + '\n' + snippet }))
        setDirty(true)
      }
    } catch (err) {
      setToast('图片插入失败: ' + err.message)
    }
  }

  if (!supported) {
    return <div className="writer-shell"><div className="writer-empty">写作工具需要 Chrome 或 Edge 浏览器（File System Access）。</div></div>
  }

  return (
    <div className="writer-shell">
      <div className="writer-topbar">
        <span className="writer-topbar-title">✏ 写作工具</span>
        <button className="writer-btn" onClick={handleOpenDir}>打开 content 目录</button>
        {permissionNeeded && <button className="writer-btn" onClick={handleReauthorize}>重新授权</button>}
        <span style={{ flex: 1 }} />
        {dir && <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>已连接：content/</span>}
        {toast && <span style={{ fontSize: '12px', color: 'var(--accent-pink)' }}>{toast}</span>}
      </div>
      {!dir ? (
        <div className="writer-empty">
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '16px' }}>点击「打开 content 目录」选择博客的 content/ 文件夹（需包含 posts/ 和 images/ 子目录）</p>
            <button className="writer-btn" onClick={handleOpenDir}>选择文件夹</button>
          </div>
        </div>
      ) : (
        <div className="writer-main">
          <aside className="writer-list">
            <button className="writer-list-item" style={{ fontWeight: 700 }} onClick={handleNew}>＋ 新建文章</button>
            {articles.map(a => (
              <button key={a.name} className={`writer-list-item${current.name === a.name ? ' active' : ''}`} onClick={() => handleSelect(a.name)}>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '2px' }}>
                  {a.category || '未分类'}{a.tags.length ? ' · ' + a.tags.join(', ') : ''}
                </div>
              </button>
            ))}
          </aside>
          <div className="writer-editor">
            <WriterToolbar
              onImportMd={handleImportMd}
              onInsertImage={file => insertImage(file)}
              onSave={handleSave}
              dirty={dirty}
              saving={saving}
            />
            <WriterMetaForm
              form={current}
              categories={catTags.categories}
              tags={catTags.tags}
              onField={onField}
              onPickCover={async e => {
                const f = e.target.files?.[0]
                if (f) {
                  if (dir) {
                    try {
                      const url = await copyImageTo(dir, f)
                      onField('coverImage', url)
                    } catch (err) {
                      setToast('封面上传失败: ' + err.message)
                    }
                  } else {
                    setToast('请先打开 content 目录')
                  }
                }
                e.target.value = ''
              }}
              coverInputRef={coverInputRef}
            />
            <div className="writer-body">
              <textarea
                ref={textareaRef}
                value={current.content}
                onChange={e => onField('content', e.target.value)}
                placeholder="在这里写 Markdown 正文…（支持粘贴图片自动插入）"
              />
              <WriterPreview form={current} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
