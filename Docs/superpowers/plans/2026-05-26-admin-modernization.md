# 后台管理系统现代化改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 BlockNote 块编辑器替换 textarea，统一所有管理页面为深色侧边栏+白色内容区的现代视觉风格，支持 .md 文件上传和笔记转文章。

**Architecture:** BlockNote (`@blocknote/react` + `@blocknote/core` + `@blocknote/mantine`) 接管文章编辑器，Markdown ↔ 块互相转换，前台 react-markdown 渲染不变。新 CSS (`admin-new.css`) 覆盖全局后台样式。

**Tech Stack:** React 18, BlockNote v0.50+, Mantine, CSS Variables

---

### Task 1: 安装 BlockNote 依赖 + 创建新后台样式

**Files:**
- Modify: `client/package.json`
- Create: `client/src/styles/admin-new.css`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: 安装 BlockNote npm 包**

```bash
cd /c/Blog/client && npm install @blocknote/core @blocknote/react @blocknote/mantine
```

- [ ] **Step 2: 创建 `admin-new.css`**

深色侧边栏 + 统一卡片表格 + BlockNote 主题适配：

```css
/* ===== Admin New: Dark Sidebar + Unified Cards ===== */

/* Dark sidebar */
.admin-layout-new .admin-sidebar {
  background: #1a1a2e;
  border-right: 1px solid rgba(255,255,255,0.06);
}
.admin-layout-new .admin-sidebar-title {
  color: #fff;
}
.admin-layout-new .admin-nav-link {
  color: rgba(255,255,255,0.55);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.admin-layout-new .admin-nav-link:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.85);
}
.admin-layout-new .admin-nav-link.active {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.admin-layout-new .admin-logout-btn {
  color: rgba(255,255,255,0.35);
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-layout-new .admin-logout-btn:hover {
  color: var(--accent-pink);
}

/* Content area */
.admin-layout-new .admin-content {
  background: #f8f9fb;
}
[data-theme="dark"] .admin-layout-new .admin-content {
  background: var(--bg);
}

/* Admin page header (title + action button) */
.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.admin-page-header .admin-page-title {
  margin-bottom: 0;
}

/* Unified table */
.admin-table-wrap {
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
[data-theme="dark"] .admin-table-wrap {
  background: var(--surface);
  border-color: var(--border);
}
.admin-table th {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e8eaee;
}
[data-theme="dark"] .admin-table th {
  background: var(--surface);
  color: var(--fg-secondary);
  border-color: var(--border);
}
.admin-table td {
  padding: 12px 16px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}
[data-theme="dark"] .admin-table td {
  color: var(--fg-secondary);
  border-color: var(--border);
}
.admin-table tr:last-child td {
  border-bottom: none;
}
.admin-table tr:hover td {
  background: #f9fafb;
}
[data-theme="dark"] .admin-table tr:hover td {
  background: var(--accent-dim);
}

/* Badge */
.admin-badge-published {
  background: #dcfce7;
  color: #166534;
}
[data-theme="dark"] .admin-badge-published {
  background: rgba(34,197,94,0.15);
  color: #4ade80;
}
.admin-badge-draft {
  background: #f3f4f6;
  color: #6b7280;
}
[data-theme="dark"] .admin-badge-draft {
  background: rgba(156,163,175,0.15);
  color: #9ca3af;
}
.admin-badge-pending {
  background: #fef3c7;
  color: #92400e;
}
[data-theme="dark"] .admin-badge-pending {
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
}

/* Admin card */
.admin-card {
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
[data-theme="dark"] .admin-card {
  background: var(--surface);
  border-color: var(--border);
}

/* Operation links row in tables */
.admin-actions {
  display: flex;
  gap: 12px;
}
.admin-actions button,
.admin-actions a {
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-body);
  text-decoration: none;
}
.admin-action-edit {
  color: #22c55e;
}
.admin-action-edit:hover {
  color: #16a34a;
}
.admin-action-publish {
  color: var(--accent);
}
.admin-action-publish:hover {
  color: #0077aa;
}
.admin-action-delete {
  color: var(--accent-pink);
}
.admin-action-delete:hover {
  color: #d94a7a;
}

/* BlockNote theme overrides */
.bn-root[data-color-scheme="light"] {
  --bn-colors-editor-text: #374151;
  --bn-colors-editor-background: #ffffff;
  --bn-colors-side-menu: #9ca3af;
  --bn-colors-side-menu-button: #6b7280;
  --bn-colors-hovered-text: #111827;
  --bn-colors-menu-text: #374151;
  --bn-colors-menu-background: #ffffff;
  --bn-colors-tooltip-text: #ffffff;
  --bn-colors-tooltip-background: #111827;
  --bn-colors-highlighted-gray: #f3f4f6;
}
.bn-root[data-color-scheme="dark"] {
  --bn-colors-editor-text: #e5e7eb;
  --bn-colors-editor-background: var(--card, #1e1e2e);
  --bn-colors-side-menu: #6b7280;
  --bn-colors-side-menu-button: #9ca3af;
  --bn-colors-hovered-text: #f9fafb;
  --bn-colors-menu-text: #e5e7eb;
  --bn-colors-menu-background: #1f2937;
  --bn-colors-tooltip-text: #ffffff;
  --bn-colors-tooltip-background: #374151;
  --bn-colors-highlighted-gray: #374151;
}
/* Remove default BlockNote border, let editor container handle it */
.bn-editor {
  border: none !important;
}
```

- [ ] **Step 3: 在 main.jsx 导入 admin-new.css**

在 `admin.css` 导入之后添加：

```jsx
import './styles/admin-new.css'
```

- [ ] **Step 4: 验证**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 构建无报错，依赖安装成功。

- [ ] **Step 5: 提交**

```bash
git add client/package.json client/package-lock.json client/src/styles/admin-new.css client/src/main.jsx
git commit -m "chore: 安装 BlockNote 依赖，创建新后台样式 admin-new.css"
```

---

### Task 2: 重构 AdminLayout — 深色侧边栏 + emoji 图标

**Files:**
- Modify: `client/src/components/AdminLayout.jsx`

- [ ] **Step 1: 替换 AdminLayout.jsx 全部内容**

添加 `.admin-layout-new` class 到根元素，导航项加 emoji 图标，使用 `useLocation` 高亮当前页：

```jsx
import { useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: '仪表盘', emoji: '📊', exact: true },
  { to: '/admin/posts', label: '文章管理', emoji: '📝' },
  { to: '/admin/posts/new', label: '写文章', emoji: '✏️' },
  { to: '/admin/categories', label: '分类管理', emoji: '🏷️' },
  { to: '/admin/tags', label: '标签管理', emoji: '🔖' },
  { to: '/admin/comments', label: '评论管理', emoji: '💬' },
  { to: '/admin/notes', label: '笔记管理', emoji: '📓' },
  { to: '/admin/appearance', label: '外观设置', emoji: '🎨' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token, navigate])

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  function isActive(item) {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  if (!token) return null

  return (
    <div className="admin-layout admin-layout-new">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-sidebar-title">博客后台</Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link${isActive(item) ? ' active' : ''}`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="admin-logout-btn">
          <span>↪️</span>
          <span>退出登录</span>
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 验证构建**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/components/AdminLayout.jsx
git commit -m "refactor(admin): 深色侧边栏 + emoji 导航图标"
```

---

### Task 3: BlockNote PostEditor — 块编辑器替换 textarea

**Files:**
- Modify: `client/src/pages/admin/PostEditor.jsx`

- [ ] **Step 1: 重写 PostEditor.jsx**

用 BlockNote 替换 textarea + react-markdown 预览。保留右侧元数据面板和保存逻辑：

```jsx
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
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  const mdFileRef = useRef(null)

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
      setCategoryId(post.categoryId || '')
      setSelectedTags(post.tags?.map(t => t.id) || [])
      // Load Markdown content into BlockNote blocks
      if (post.content && editor) {
        const blocks = await editor.tryParseMarkdownToBlocks(post.content)
        editor.replaceBlocks(editor.document, blocks)
      }
    }).catch(() => setToast({ type: 'error', text: '加载文章失败' }))
      .finally(() => setLoading(false))
  }, [id, isEdit, editor])

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
    // Auto-detect title from first H1
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
              <option value="">无分类</option>
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
          <div className="admin-card">
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

- [ ] **Step 2: 验证构建**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/pages/admin/PostEditor.jsx
git commit -m "feat(admin): BlockNote 块编辑器替换 textarea + .md 上传"
```

---

### Task 4: 统一重构所有管理页面样式

**Files:**
- Modify: `client/src/pages/admin/AdminDashboard.jsx`
- Modify: `client/src/pages/admin/PostManager.jsx`
- Modify: `client/src/pages/admin/CategoryManager.jsx`
- Modify: `client/src/pages/admin/TagManager.jsx`
- Modify: `client/src/pages/admin/CommentManager.jsx`
- Modify: `client/src/pages/admin/AppearanceSettings.jsx`

每页改动类似：应用 `admin-card`、`admin-page-header`、`admin-actions` 新 class，表格操作按钮用 `admin-action-*` class。

- [ ] **Step 1: 提取通用操作按钮 class**

所有页面的操作按钮（编辑/删除/发布）改为使用 `admin-action-edit`、`admin-action-publish`、`admin-action-delete` CSS class。

- [ ] **PostManager.jsx** — 页面 header 改用 `admin-page-header`，操作列按钮改用 `admin-actions` + `admin-action-*`：

```jsx
// Replace lines 44-47 with:
<div className="admin-page-header">
  <h1 className="admin-page-title">文章管理</h1>
  <Link to="/admin/posts/new" className="admin-btn admin-btn-primary">写文章</Link>
</div>

// Replace lines 70-78 (td actions) with:
<td>
  <div className="admin-actions">
    <button onClick={() => handleToggleStatus(post)} className="admin-action-publish">
      {post.status === 'published' ? '归档' : '发布'}
    </button>
    <Link to={`/admin/posts/${post.id}/edit`} className="admin-action-edit">编辑</Link>
    <button onClick={() => handleDelete(post.id)} className="admin-action-delete">删除</button>
  </div>
</td>
```

- [ ] **CategoryManager.jsx** — similar changes for header + action column

- [ ] **TagManager.jsx** — similar changes

- [ ] **CommentManager.jsx** — similar changes + `admin-badge-pending` for pending status

- [ ] **AdminDashboard.jsx** — `admin-card` already used, just update grid gap/style

- [ ] **AppearanceSettings.jsx** — keep existing layout, change inline message to use `admin-card` pattern

- [ ] **Step 2: 验证构建**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/pages/admin/AdminDashboard.jsx client/src/pages/admin/PostManager.jsx client/src/pages/admin/CategoryManager.jsx client/src/pages/admin/TagManager.jsx client/src/pages/admin/CommentManager.jsx client/src/pages/admin/AppearanceSettings.jsx
git commit -m "refactor(admin): 统一所有管理页面新样式"
```

---

### Task 5: NoteManager 重构 — 分栏布局 + MD 上传 + 一键转文章

**Files:**
- Modify: `client/src/pages/admin/NoteManager.jsx`

- [ ] **Step 1: 重写 NoteManager.jsx**

分栏布局（笔记列表 + 预览），新增"转为文章"按钮跳转到 PostEditor：

```jsx
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
```

- [ ] **Step 2: 验证构建**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/pages/admin/NoteManager.jsx
git commit -m "feat(admin): 笔记分栏布局 + .md 上传 + 一键转文章"
```

---

### Task 6: 构建验证

- [ ] **Step 1: 完整构建**

```bash
cd /c/Blog/client && npx vite build
```
Expected: 构建成功，无报错。

- [ ] **Step 2: 手动验收清单**
- [ ] 启动 `cd server && npm run dev` + `cd client && npm run dev`
- [ ] 登录后台，侧边栏是深色底 + emoji 图标
- [ ] 写文章页面，BlockNote 编辑器可用（/ 命令、拖拽排序）
- [ ] 拖拽图片到编辑器，自动上传并显示
- [ ] 点击"上传 .md"按钮，选择 .md 文件，内容自动插入编辑器
- [ ] 保存文章，前台渲染正常
- [ ] 编辑已有文章，Markdown 内容正确加载到块编辑器
- [ ] 所有管理页面（文章、分类、标签、评论、笔记、仪表盘、外观设置）样式统一
- [ ] 笔记管理：点击笔记在右侧预览，编辑后保存，"转为文章"跳转到编辑器
- [ ] 暗色模式切换正常
