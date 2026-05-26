# 管理后台 UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use ultrawork to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现管理后台文章编辑器实时预览和全局交互体验优化

**Architecture:** 两个独立工作流并行推进：(1) 基于已有 react-markdown 依赖为 PostEditor 添加实时预览面板 + 拖拽上传；(2) 新建 ConfirmModal 组件替换所有 `window.confirm` 调用，统一 Loading 状态

**Tech Stack:** React 18, react-markdown 9, remark-gfm, rehype-highlight

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| 新建 | `client/src/components/ConfirmModal.jsx` | 确认弹窗组件，替代 window.confirm |
| 修改 | `client/src/pages/admin/PostEditor.jsx` | 添加实时预览、拖拽上传、Ctrl+S |
| 修改 | `client/src/pages/admin/PostManager.jsx` | confirm → ConfirmModal |
| 修改 | `client/src/pages/admin/CategoryManager.jsx` | confirm → ConfirmModal, 加 Loading |
| 修改 | `client/src/pages/admin/TagManager.jsx` | confirm → ConfirmModal, 加 Loading |
| 修改 | `client/src/pages/admin/CommentManager.jsx` | confirm → ConfirmModal, 加 Loading |
| 修改 | `client/src/pages/admin/NoteManager.jsx` | confirm → ConfirmModal, alert → 行内验证, 加 Loading |
| 修改 | `client/src/pages/admin/AdminDashboard.jsx` | 加 Loading |
| 修改 | `client/src/styles/admin.css` | 添加 ConfirmModal 和编辑器预览相关样式 |

---

## Wave 1（并行执行 — 无依赖）

### Task 1: 创建 ConfirmModal 组件

**Files:**
- Create: `client/src/components/ConfirmModal.jsx`
- Modify: `client/src/styles/admin.css`

- [ ] **Step 1: 创建 ConfirmModal.jsx**

```jsx
import { useEffect } from 'react'

export default function ConfirmModal({ open, title, message, confirmText, cancelText, onConfirm, onCancel, danger }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-title">{title || '确认操作'}</div>
        <div className="confirm-message">{message || '确定继续吗？'}</div>
        <div className="confirm-actions">
          <button onClick={onCancel} className="admin-btn">{cancelText || '取消'}</button>
          <button onClick={onConfirm} className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`}>
            {confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 在 admin.css 末尾添加样式**

追加到 `client/src/styles/admin.css`：

```css
/* ===== Confirm Modal ===== */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  animation: fadeIn 0.15s ease;
}
.confirm-modal {
  background: var(--surface);
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  animation: scaleIn 0.15s ease;
}
.confirm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 8px;
}
.confirm-message {
  font-size: 13px;
  color: var(--fg-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

### Task 2: 重构 PostEditor — 实时预览 + 拖拽上传 + Ctrl+S

**Files:**
- Modify: `client/src/pages/admin/PostEditor.jsx`（重写整个文件）

完整的新 `PostEditor.jsx` 代码：

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getPost, createPost, updatePost, getCategories, getTags } from '../../api/posts'
import { uploadImage } from '../../api/upload'
import AdminToast from '../../components/AdminToast'

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const textareaRef = useRef(null)
  const previewRef = useRef(null)
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
  const [showPreview, setShowPreview] = useState(true)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false) // prevent scroll loop

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    getPost(id).then(res => {
      const post = res.data.data
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.coverImage || '')
      setJpChar(post.jpChar || '')
      setCategoryId(post.categoryId || '')
      setSelectedTags(post.tags?.map(t => t.id) || [])
    }).catch(() => setToast({ type: 'error', text: '加载文章失败' }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  async function handleSave(status) {
    const data = { title, content, excerpt, coverImage, jpChar: jpChar || null, status, categoryId: categoryId || null, tagIds: selectedTags }
    try {
      if (isEdit) {
        await updatePost(id, data)
        setToast('已保存')
      } else {
        await createPost(data)
        setToast('已发布')
        navigate('/admin/posts')
      }
    } catch (err) {
      setToast({ type: 'error', text: '保存失败: ' + (err.response?.data?.error || err.message) })
    }
  }

  function toggleTag(tagId) {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    e.target.value = ''
  }

  async function uploadFile(file) {
    if (!file.type.startsWith('image/')) return
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
      setToast({ type: 'error', text: '上传失败: ' + (err.response?.data?.error || err.message) })
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  // Scroll sync: editor → preview
  function handleEditorScroll(e) {
    if (!syncing && previewRef.current) {
      setSyncing(true)
      const el = e.target
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
      const previewEl = previewRef.current
      previewEl.scrollTop = pct * (previewEl.scrollHeight - previewEl.clientHeight || 1)
      setTimeout(() => setSyncing(false), 50)
    }
  }

  // Ctrl+S save as draft
  const saveDraft = useCallback(() => handleSave('draft'), [title, content, excerpt, coverImage, jpChar, categoryId, selectedTags, isEdit, id, navigate])

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveDraft()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [saveDraft])

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
        {/* 左侧：编辑器 + 预览 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题"
            style={{ width: '100%', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '18px', fontWeight: 600, background: 'var(--card)', color: 'var(--fg)', boxSizing: 'border-box' }} />

          {/* 工具栏 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
            <span style={{ flex: 1 }} />
            <button onClick={() => setShowPreview(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 10px', borderRadius: '6px', background: showPreview ? 'var(--accent-dim)' : 'transparent', border: '1px solid var(--border)', color: showPreview ? 'var(--accent)' : 'var(--fg-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {showPreview ? '隐藏预览' : '预览'}
            </button>
          </div>

          {/* 编辑区 + 预览区 */}
          <div style={{ flex: 1, display: 'flex', gap: '8px', overflow: 'hidden', minHeight: 0 }}>
            <textarea ref={textareaRef} value={content} onChange={e => setContent(e.target.value)} onScroll={handleEditorScroll}
              placeholder="正文（Markdown），支持拖拽图片上传"
              style={{ flex: showPreview ? '0 0 50%' : 1, padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'none', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', boxSizing: 'border-box', outline: 'none' }}
              onDrop={handleDrop} onDragOver={handleDragOver} />

            {showPreview && (
              <div ref={previewRef} className="article-body"
                style={{ flex: '0 0 50%', padding: '16px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', overflow: 'auto', boxSizing: 'border-box' }}>
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p style={{ color: 'var(--fg-muted)', fontSize: '13px' }}>预览区域</p>
                )}
              </div>
            )}
          </div>

          {/* 底部按钮 */}
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

        {/* 右侧：元数据面板 */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
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
```

---

## Wave 2（依赖 Task 1，彼此可并行）

### Task 3: PostManager + CategoryManager → ConfirmModal + Loading

**Files:**
- Modify: `client/src/pages/admin/PostManager.jsx`
- Modify: `client/src/pages/admin/CategoryManager.jsx`

#### PostManager.jsx 改动

- [ ] **Step 1: 添加 import ConfirmModal**

在第 1 行附近添加：
```jsx
import ConfirmModal from '../../components/ConfirmModal'
```

- [ ] **Step 2: 添加 confirmDelete state**

在 `const [toast, setToast] = useState(null)` 之后添加：
```jsx
const [confirmDelete, setConfirmDelete] = useState(null) // { id }
```

- [ ] **Step 3: 修改 handleDelete**

```jsx
async function handleDelete(id) {
  setConfirmDelete({ id })
}
```

- [ ] **Step 4: 在 return 中添加 ConfirmModal**

在 `</div>` 闭合前（AdminToast 之后，表格之前）添加：
```jsx
<ConfirmModal
  open={!!confirmDelete}
  title="确认删除"
  message="确定删除此文章？此操作不可撤销。"
  confirmText="删除"
  danger
  onConfirm={async () => {
    try {
      await deletePost(confirmDelete.id)
      setToast('已删除')
      loadPosts()
    } catch { setToast({ type: 'error', text: '删除失败' }) }
    setConfirmDelete(null)
  }}
  onCancel={() => setConfirmDelete(null)}
/>
```

#### CategoryManager.jsx 改动

- [ ] **Step 5: 添加 import**

```jsx
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'
```

- [ ] **Step 6: 添加 confirmDelete state**

在 `const [toast, setToast] = useState(null)` 之后：
```jsx
const [confirmDelete, setConfirmDelete] = useState(null)
```

- [ ] **Step 7: 修改 handleDelete**

```jsx
async function handleDelete(id) {
  setConfirmDelete({ id })
}
```

- [ ] **Step 8: 添加 Loading 返回**

在 `return` 之前添加：
```jsx
if (loading) return <Loading />
```

- [ ] **Step 9: 渲染 ConfirmModal**

放在 `</div>` 闭合前：
```jsx
<ConfirmModal
  open={!!confirmDelete}
  title="确认删除"
  message="确定删除此分类？相关文章将变为未分类。"
  confirmText="删除"
  danger
  onConfirm={async () => {
    try {
      await deleteCategory(confirmDelete.id)
      setToast('已删除')
      load()
    } catch { setToast({ type: 'error', text: '删除失败' }) }
    setConfirmDelete(null)
  }}
  onCancel={() => setConfirmDelete(null)}
/>
```

---

### Task 4: TagManager + CommentManager → ConfirmModal + Loading

**Files:**
- Modify: `client/src/pages/admin/TagManager.jsx`
- Modify: `client/src/pages/admin/CommentManager.jsx`

#### TagManager.jsx 改动

- [ ] **Step 1: 添加 import**

```jsx
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'
```

- [ ] **Step 2: 添加 confirmDelete state**

```jsx
const [confirmDelete, setConfirmDelete] = useState(null)
```

- [ ] **Step 3: 修改 handleDelete**

```jsx
async function handleDelete(id) {
  setConfirmDelete({ id })
}
```

- [ ] **Step 4: 加 Loading**

```jsx
if (loading) return <Loading />
```

- [ ] **Step 5: 渲染 ConfirmModal**

```jsx
<ConfirmModal
  open={!!confirmDelete}
  title="确认删除"
  message="确定删除此标签？"
  confirmText="删除"
  danger
  onConfirm={async () => {
    try {
      await deleteTag(confirmDelete.id)
      setToast('已删除')
      load()
    } catch { setToast({ type: 'error', text: '删除失败' }) }
    setConfirmDelete(null)
  }}
  onCancel={() => setConfirmDelete(null)}
/>
```

#### CommentManager.jsx 改动

- [ ] **Step 6: 添加 import**

```jsx
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'
```

- [ ] **Step 7: 添加 confirmDelete state**

```jsx
const [confirmDelete, setConfirmDelete] = useState(null)
```

- [ ] **Step 8: 修改 handleDelete**

```jsx
async function handleDelete(id) {
  setConfirmDelete({ id })
}
```

- [ ] **Step 9: 加 Loading 和 ConfirmModal**

在 return 前加 Loading：
```jsx
if (loading) return <Loading />
```

在闭合 `</div>` 前渲染 ConfirmModal（与 Task 3 相同模式）：
```jsx
<ConfirmModal
  open={!!confirmDelete}
  title="确认删除"
  message="确定删除此评论？此操作不可撤销。"
  confirmText="删除"
  danger
  onConfirm={async () => {
    try {
      await client.delete(`/comments/${confirmDelete.id}`)
      setToast('已删除')
      load()
    } catch { setToast({ type: 'error', text: '删除失败' }) }
    setConfirmDelete(null)
  }}
  onCancel={() => setConfirmDelete(null)}
/>
```

---

### Task 5: NoteManager + AdminDashboard → ConfirmModal + 行内验证 + Loading

**Files:**
- Modify: `client/src/pages/admin/NoteManager.jsx`
- Modify: `client/src/pages/admin/AdminDashboard.jsx`

#### NoteManager.jsx 改动

- [ ] **Step 1: 添加 import**

```jsx
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'
```

- [ ] **Step 2: 添加 confirmDelete state 和验证错误 state**

```jsx
const [confirmDelete, setConfirmDelete] = useState(null)
const [validationError, setValidationError] = useState('')
```

- [ ] **Step 3: 修改 handleSave — 行内验证替代 alert**

```jsx
async function handleSave() {
  if (!editTitle.trim() || !editContent.trim()) {
    setValidationError('标题和内容不能为空')
    return
  }
  setValidationError('')
  try {
    if (editing) {
      await updateNote(editing, { title: editTitle, content: editContent })
      setToast('已保存')
    }
    setEditing(null)
    load()
  } catch { setToast({ type: 'error', text: '保存失败' }) }
}
```

- [ ] **Step 4: 修改 handleDelete**

```jsx
async function handleDelete(id) {
  setConfirmDelete({ id })
}
```

- [ ] **Step 5: 替换 handleFileUpload 中的 alert**

```jsx
async function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file || !file.name.endsWith('.md')) {
    setToast({ type: 'error', text: '请上传 .md 文件' })
    return
  }
  // ... rest unchanged
}
```

- [ ] **Step 6: 替换 handleExport 中的 alert**

```jsx
async function handleExport(id) {
  try {
    const res = await exportNote(id)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'note.md'; a.click()
    URL.revokeObjectURL(url)
  } catch { setToast({ type: 'error', text: '导出失败' }) }
}
```

- [ ] **Step 7: 替换 Loading 文本为组件**

将：
```jsx
if (loading) return <div style={{ color: 'var(--fg-secondary)' }}>加载中...</div>
```
改为：
```jsx
if (loading) return <Loading />
```

- [ ] **Step 8: 在编辑表单中添加行内验证显示**

在编辑面板的 textarea 之后添加验证错误提示：
```jsx
{validationError && (
  <p style={{ fontSize: '12px', color: 'var(--accent-pink)', marginTop: '4px' }}>{validationError}</p>
)}
```

- [ ] **Step 9: 渲染 ConfirmModal**

```jsx
<ConfirmModal
  open={!!confirmDelete}
  title="确认删除"
  message="确定删除此笔记？此操作不可撤销。"
  confirmText="删除"
  danger
  onConfirm={async () => {
    try {
      await deleteNote(confirmDelete.id)
      setToast('已删除')
      load()
    } catch { setToast({ type: 'error', text: '删除失败' }) }
    setConfirmDelete(null)
  }}
  onCancel={() => setConfirmDelete(null)}
/>
```

#### AdminDashboard.jsx 改动

- [ ] **Step 10: 添加 import + loading state**

添加 import：
```jsx
import Loading from '../../components/Loading'
```

已有 `loading` state 但未使用。修改 useEffect 以在 finally 关闭 loading：
```jsx
useEffect(() => {
  // ... existing Promise.all
  .then(([postsRes, catRes, tagRes, commentsRes, pendingRes, notesRes]) => {
    // ... existing
  }).catch(() => {}).finally(() => setLoading(false))
}, [])
```

添加 loading state（需要在第 7 行 `const [stats, setStats] = useState(...)` 之后添加）：
```jsx
// 已有 stats state
```

注意：`AdminDashboard` 已经通过 `useState` 初始化 `stats` 为对象，但缺一个 `loading` state。需要添加：
```jsx
const [loading, setLoading] = useState(true)
```

然后在 `return` 之前：
```jsx
if (loading) return <Loading />
```

---

## 验证

所有 Task 完成后执行：

```bash
cd client && npx vite build
```

预期：build 成功，无报错。
