import { useState, useEffect, useRef, useCallback } from 'react'
import {
  pickContentDir, restoreContentDir, ensureWritePermission, listMarkdownFiles, readTextFile, copyImageTo,
} from '../utils/file-system'
import { parseFrontmatter } from '../utils/frontmatter'
import { slugify } from '../utils/slugify'
import useWriterArticle from '../components/writer/useWriterArticle'
import WriterToolbar from '../components/writer/WriterToolbar'
import WriterMetaForm from '../components/writer/WriterMetaForm'
import WriterPreview from '../components/writer/WriterPreview'
import '../styles/writer.css'

export default function WriterPage() {
  const [dir, setDir] = useState(null)
  const [permissionNeeded, setPermissionNeeded] = useState(false)
  const [articles, setArticles] = useState([])
  const [catTags, setCatTags] = useState({ categories: [], tags: [] })
  const coverInputRef = useRef(null)

  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  // Collect posts list + category/tag options from the content dir (authoritative source).
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

  const article = useWriterArticle(dir, loadArticles)
  const { current, dirty, saving, toast, setToast, textareaRef, onField, handleSelect, handleNew, handleImportMd, handleSave, insertImage } = article

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
  }, [supported, loadArticles])

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
