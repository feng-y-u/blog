# 写作工具实施计划（/writer 路由）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在博客内实现 `/writer` 写作工具：File System Access 直写 `content/`，可视化设置封面/分类/标签、插入图片（自动复制）、实时预览、导入 md，保存时自动生成文件名与 frontmatter。

**Architecture:** 纯前端实现（零新依赖）：`utils/slugify.js` 共享 slug 规则（构建脚本与工具共用）；`utils/frontmatter.js` 轻量解析/生成（保留未知字段）；`utils/file-system.js` 目录句柄管理（IndexedDB 持久化 + 权限）；`WriterPage` + 3 个 writer 子组件（MetaForm/Preview/Toolbar）；`styles/writer.css` 布局样式；App.jsx 注册 `/writer` 隐藏路由。

**Tech Stack:** React 19、File System Access API（Chromium only）、IndexedDB、react-markdown 渲染链（复用 ArticleBody/PostCard）。项目无测试基础设施，验证方式：node --check + node -e 单测式断言 + 构建脚本回归；File System Access 交互由用户本机 Chrome 实测。

**设计文档：** `Docs/superpowers/specs/2026-08-14-writer-tool-design.md`

**工作分支：** `feature`

---

### Task 1: 共享 slugify 模块 + 构建脚本改造

**Files:**
- Create: `client/src/utils/slugify.js`
- Modify: `client/scripts/build-content.mjs`

- [ ] **Step 1: 创建 `client/src/utils/slugify.js`（完整内容）**

```js
// Shared slug rules used by both the build script (node) and the writer tool (browser).
// Keep in sync with content/post filename derivation in build-content.mjs.
export function slugify(text) {
  let slug = String(text).toLowerCase().trim()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'untitled'
}
```

- [ ] **Step 2: 修改 `client/scripts/build-content.mjs`**

读取文件，做两处修改：
1. 删除文件内定义的 `slugify` 函数（原样删除整个函数块）
2. 在 import 区（文件顶部）增加：

```js
import { slugify } from '../src/utils/slugify.js'
```

其余代码不动（slugify 调用点不变，只是来源变为共享模块）。

- [ ] **Step 3: 验证（回归）**

```bash
cd E:\newblog\client && node scripts/build-content.mjs
```

预期输出：`✔ posts: 1, notes: 1, categories: 1, tags: 2`（与改造前完全一致，分类 slug 仍为 `技术`）

- [ ] **Step 4: 提交**

```bash
git -C E:\newblog add client/src/utils/slugify.js client/scripts/build-content.mjs
git -C E:\newblog commit -m "refactor(static): slug规则抽为共享模块"
```

---

### Task 2: frontmatter 与文件系统工具模块

**Files:**
- Create: `client/src/utils/frontmatter.js`
- Create: `client/src/utils/file-system.js`

- [ ] **Step 1: 创建 `client/src/utils/frontmatter.js`（完整内容）**

```js
// Minimal frontmatter parser/generator for the writer tool.
// Handles single-line "key: value", inline arrays "tags: [a, b]", comment lines.
// Unknown fields are kept in `data` and re-emitted on save (no data loss).

export function parseFrontmatter(raw) {
  const text = String(raw)
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, order: [], content: text }
  const body = match[1]
  const data = {}
  const order = []
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf(':')
    if (idx === -1) continue
    const key = t.slice(0, idx).trim()
    let value = t.slice(idx + 1).trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      value = value === 'true'
    } else if (/^-?\d+$/.test(value)) {
      value = Number(value)
    } else {
      value = value.replace(/^['"]|['"]$/g, '')
    }
    data[key] = value
    order.push(key)
  }
  return { data, order, content: text.slice(match[0].length) }
}

export function stringifyFrontmatter(data, order) {
  const lines = ['---']
  for (const key of order) {
    const v = data[key]
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) lines.push(`${key}: [${v.map(String).join(', ')}]`)
    else if (typeof v === 'boolean') lines.push(`${key}: ${v}`)
    else if (typeof v === 'number') lines.push(`${key}: ${v}`)
    else lines.push(`${key}: ${String(v).replace(/\n/g, ' ')}`)
  }
  lines.push('---')
  return lines.join('\n') + '\n'
}
```

- [ ] **Step 2: 创建 `client/src/utils/file-system.js`（完整内容）**

```js
// File System Access helpers: directory handle persistence (IndexedDB),
// permission handling, file read/write, markdown listing and image copying.
// Chromium only — callers must feature-detect `window.showDirectoryPicker`.

const IDB_NAME = 'writer-fs'
const IDB_STORE = 'handles'
const IDB_KEY = 'content-dir'

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key) {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key, value) {
  const db = await idb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function pickContentDir() {
  const dir = await window.showDirectoryPicker()
  await idbSet(IDB_KEY, dir)
  return dir
}

// Returns the persisted handle, or null when absent. The caller must check
// permission via ensureWritePermission() (which needs a user gesture when
// permission was not previously granted).
export async function restoreContentDir() {
  try {
    return (await idbGet(IDB_KEY)) || null
  } catch {
    return null
  }
}

export async function ensureWritePermission(dir) {
  if (!dir) return false
  if ((await dir.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await dir.requestPermission({ mode: 'readwrite' })) === 'granted'
}

export async function readTextFile(dir, name) {
  const handle = await dir.getFileHandle(name)
  const file = await handle.getFile()
  return file.text()
}

export async function writeTextFile(dir, name, text) {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

export async function listMarkdownFiles(dir) {
  const names = []
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file' && name.endsWith('.md')) names.push(name)
  }
  return names.sort()
}

// Copies an image File into content/images/ (creating the dir if needed),
// resolving name collisions with a -1/-2 suffix. Returns the public URL.
export async function copyImageTo(dir, file, preferredName) {
  const imagesDir = await dir.getDirectoryHandle('images', { create: true })
  let name = (preferredName || file.name || 'image.png').replace(/[\\/:*?"<>|]/g, '-').trim()
  if (!name) name = 'image.png'
  const base = name.replace(/\.[^.]+$/, '')
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  let candidate = name
  let i = 1
  for (;;) {
    try {
      await imagesDir.getFileHandle(candidate)
      candidate = `${base}-${i}${ext}`
      i += 1
    } catch {
      break // not found -> name is free
    }
  }
  const handle = await imagesDir.getFileHandle(candidate, { create: true })
  const writable = await handle.createWritable()
  await writable.write(file)
  await writable.close()
  return `/images/${candidate}`
}
```

- [ ] **Step 3: node 单测式验证 frontmatter 解析器**

```bash
cd E:\newblog\client && node -e "
import('./src/utils/frontmatter.js').then(m => {
  const raw = '---\ntitle: 你好\ntags: [react, vite]\ndraft: true\ncount: 3\n---\n\n# 正文\n'
  const { data, order, content } = m.parseFrontmatter(raw)
  if (data.title !== '你好') throw new Error('title')
  if (data.tags.length !== 2 || data.tags[1] !== 'vite') throw new Error('tags')
  if (data.draft !== true) throw new Error('draft')
  if (data.count !== 3) throw new Error('count')
  if (order.length !== 4) throw new Error('order')
  if (content.trim() !== '# 正文') throw new Error('content')
  const out = m.stringifyFrontmatter({ ...data, title: '新标题' }, order)
  if (!out.includes('title: 新标题') || !out.includes('draft: true')) throw new Error('stringify')
  console.log('frontmatter OK')
})
"
```

预期输出：`frontmatter OK`

- [ ] **Step 4: 语法检查**

```bash
node --check E:\newblog\client\src\utils\frontmatter.js
node --check E:\newblog\client\src\utils\file-system.js
```

预期：无输出（0 错误）。

- [ ] **Step 5: 提交**

```bash
git -C E:\newblog add client/src/utils/frontmatter.js client/src/utils/file-system.js
git -C E:\newblog commit -m "feat(writer): frontmatter解析与文件系统句柄工具"
```

---

### Task 3: Writer 页面、组件与路由

**Files:**
- Create: `client/src/components/writer/WriterMetaForm.jsx`
- Create: `client/src/components/writer/WriterPreview.jsx`
- Create: `client/src/components/writer/WriterToolbar.jsx`
- Create: `client/src/pages/WriterPage.jsx`
- Create: `client/src/styles/writer.css`
- Modify: `client/src/App.jsx`、`client/src/main.jsx`

- [ ] **Step 1: 创建 `client/src/styles/writer.css`（完整内容）**

```css
/* ===== Writer Tool (/writer) ===== */

.writer-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--fg);
}

.writer-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}

.writer-topbar-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-right: 16px;
}

.writer-main {
  display: flex;
  flex: 1;
  min-height: 0;
}

.writer-list {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.writer-list-item {
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  color: var(--fg-secondary);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: var(--transition);
}
.writer-list-item:hover {
  background: var(--accent-dim);
  color: var(--fg);
}
.writer-list-item.active {
  border-color: var(--accent);
  color: var(--fg);
}

.writer-editor {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.writer-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.writer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.writer-field.full {
  grid-column: 1 / -1;
}
.writer-field label {
  font-size: 12px;
  color: var(--fg-muted);
}

.writer-input,
.writer-select,
.writer-textarea {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--fg);
  font-size: 13px;
  font-family: var(--font-body);
}
.writer-input:focus,
.writer-select:focus,
.writer-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.writer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 0;
}
.writer-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg-secondary);
  cursor: pointer;
  font-family: var(--font-body);
  transition: var(--transition);
}
.writer-tag.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.writer-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.writer-body textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 20px;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.7;
}
.writer-body textarea:focus {
  outline: none;
}

.writer-preview {
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  overflow-y: auto;
  background: var(--surface);
  padding: 20px;
}

.writer-preview-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.writer-preview-tab {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
  font-family: var(--font-body);
}
.writer-preview-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.writer-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-muted);
  font-size: 14px;
}
```

- [ ] **Step 2: 创建 `client/src/components/writer/WriterToolbar.jsx`（完整内容）**

```jsx
import { useRef } from 'react'

export default function WriterToolbar({ onImportMd, onInsertImage, onSave, dirty, saving }) {
  const mdRef = useRef(null)
  const imgRef = useRef(null)
  const btn = {
    padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
    background: 'var(--card)', color: 'var(--fg-secondary)', cursor: 'pointer',
    fontSize: '13px', fontFamily: 'var(--font-body)', transition: 'var(--transition)',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
      <button style={btn} onClick={() => mdRef.current?.click()}>导入 .md</button>
      <button style={btn} onClick={() => imgRef.current?.click()}>插入图片</button>
      <input ref={mdRef} type="file" accept=".md" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImportMd(f); e.target.value = '' }} />
      <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onInsertImage(f); e.target.value = '' }} />
      <span style={{ flex: 1 }} />
      {dirty && <span style={{ fontSize: '12px', color: 'var(--accent-pink)' }}>● 未保存</span>}
      <button style={{ ...btn, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }} onClick={onSave} disabled={saving}>
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: 创建 `client/src/components/writer/WriterMetaForm.jsx`（完整内容）**

```jsx
import ArticleBody from '../ArticleBody'
import PostCard from '../PostCard'

// {slug,title,date,category,tags,coverImage,excerpt,jpChar,content} = form
export default function WriterMetaForm({ form, categories, tags, onField, onPickCover, coverInputRef }) {
  const inputStyle = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--fg)', fontSize: '13px', fontFamily: 'var(--font-body)' }
  const btn = { ...inputStyle, cursor: 'pointer', background: 'var(--surface)' }

  return (
    <div className="writer-meta">
      <div className="writer-field full">
        <label>标题</label>
        <input className="writer-input" value={form.title} onChange={e => onField('title', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>{form.isNew ? 'Slug（文件名主体）' : 'Slug（文件名，只读）'}</label>
        <input className="writer-input" value={form.slug} disabled={!form.isNew} onChange={e => onField('slug', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>日期（文件名前缀，新建时生效）</label>
        <input className="writer-input" type="date" value={form.date} disabled={!form.isNew} onChange={e => onField('date', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>分类</label>
        <select className="writer-select" value={form.category} onChange={e => onField('category', e.target.value)}>
          <option value="">未分类</option>
          {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
          {form.category && !categories.some(c => c.name === form.category) && (
            <option value={form.category}>{form.category}（新建）</option>
          )}
        </select>
      </div>
      <div className="writer-field">
        <label>杂志装饰字（jpChar，可选）</label>
        <input className="writer-input" value={form.jpChar} onChange={e => onField('jpChar', e.target.value)} placeholder="如：博" />
      </div>
      <div className="writer-field full">
        <label>标签（点选切换，可输入新建）</label>
        <div className="writer-tags">
          {tags.map(t => (
            <button key={t.slug} type="button"
              className={`writer-tag${form.tags.includes(t.name) ? ' active' : ''}`}
              onClick={() => onField('tags', form.tags.includes(t.name) ? form.tags.filter(x => x !== t.name) : [...form.tags, t.name])}>
              {t.name}
            </button>
          ))}
          <input className="writer-input" style={{ width: 120 }} placeholder="新标签，回车添加"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const v = e.target.value.trim()
                if (v && !form.tags.includes(v)) onField('tags', [...form.tags, v])
                e.target.value = ''
              }
            }} />
        </div>
      </div>
      <div className="writer-field full">
        <label>封面</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={btn} onClick={() => coverInputRef.current?.click()}>选择封面图片</button>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickCover} />
          {form.coverImage && (
            <>
              <img src={form.coverImage} alt="封面预览" style={{ height: '48px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              <button style={btn} onClick={() => onField('coverImage', '')}>移除</button>
            </>
          )}
        </div>
      </div>
      <div className="writer-field full">
        <label>摘要（留空则保存后由构建自动截取）</label>
        <textarea className="writer-textarea" rows={2} value={form.excerpt} onChange={e => onField('excerpt', e.target.value)} />
      </div>
      <div className="writer-field full">
        <label>正文预览（保存为 Markdown 文件）</label>
        <div className="article-body" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg)' }}>
          {form.content.trim() ? <ArticleBody content={form.content} onImageClick={() => {}} /> : <span style={{ color: 'var(--fg-muted)' }}>正文为空</span>}
        </div>
      </div>
      {form.isNew && (
        <div className="writer-field full">
          <label>文章卡片效果预览</label>
          <PostCard post={{
            slug: form.slug,
            title: form.title || '未命名文章',
            publishedAt: new Date(form.date + 'T00:00:00Z').toISOString(),
            category: form.category ? { name: form.category, slug: form.category } : null,
            tags: form.tags.map(t => ({ name: t, slug: t })),
            coverImage: form.coverImage || null,
            excerpt: form.excerpt || '',
            content: form.content,
          }} />
        </div>
      )}
    </div>
  )
}
```

（说明：文章卡片预览放在 MetaForm 底部而非独立 Preview 面板，PostCard 需要完整 post 对象；预览面板专门做 markdown 渲染——见 Step 4。两处预览覆盖"渲染出展示效果"需求。）

- [ ] **Step 4: 创建 `client/src/components/writer/WriterPreview.jsx`（完整内容）**

```jsx
import ArticleBody from '../ArticleBody'

export default function WriterPreview({ form }) {
  return (
    <div className="writer-preview">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: '0 0 12px' }}>正文预览</h2>
      <div className="article-body">
        {form.content.trim() ? <ArticleBody content={form.content} onImageClick={() => {}} /> : <span style={{ color: 'var(--fg-muted)' }}>正文为空，开始写作吧</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 创建 `client/src/pages/WriterPage.jsx`（完整内容）**

```jsx
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
  }, [dir, current, dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadArticles = useCallback(async handle => {
    const names = await listMarkdownFiles(handle)
    const items = []
    for (const name of names) {
      try {
        const raw = await readTextFile(handle, name)
        const { data } = parseFrontmatter(raw)
        items.push({ name, title: data.title || name.replace(/\.md$/, ''), category: data.category || '', tags: data.tags || [] })
      } catch {
        items.push({ name, title: name.replace(/\.md$/, ''), category: '', tags: [] })
      }
    }
    setArticles(items)
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
  }

  function handleNew() {
    if (dirty && !window.confirm('当前有未保存的更改，确定新建文章？')) return
    setCurrent(emptyForm())
    setDirty(false)
  }

  async function handleImportMd(file) {
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
  }

  async function handleSave() {
    if (!dir) { setToast('请先打开 content 目录'); return }
    const form = current
    const title = form.title.trim() || form.slug || 'untitled'
    const slug = deriveSlug(form)
    let name = form.name
    if (form.isNew) {
      name = `${form.date || TODAY}-${slug}.md`
      if (articles.some(a => a.name === name)) {
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
    const keys = form.isNew
      ? ['title', ...(form.category ? ['category'] : []), ...(form.tags.length ? ['tags'] : []), ...(form.coverImage ? ['coverImage'] : []), ...(form.excerpt ? ['excerpt'] : []), ...(form.jpChar ? ['jpChar'] : [])]
      : ['title', ...(form.category ? ['category'] : []), ...(form.tags.length ? ['tags'] : []), ...(form.coverImage ? ['coverImage'] : []), ...(form.excerpt ? ['excerpt'] : []), ...(form.jpChar ? ['jpChar'] : [])]
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
        const start = ta.selectionStart ?? current.content.length
        const end = ta.selectionEnd ?? start
        const next = current.content.slice(0, start) + snippet + current.content.slice(end)
        setCurrent(prev => ({ ...prev, content: next }))
        setDirty(true)
        requestAnimationFrame(() => {
          ta.focus()
          ta.selectionStart = ta.selectionEnd = start + snippet.length
        })
      } else {
        onField('content', current.content + '\n' + snippet)
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
              categories={[]}
              tags={[]}
              onField={onField}
              onPickCover={async e => {
                const f = e.target.files?.[0]
                if (f && dir) {
                  const url = await copyImageTo(dir, f)
                  onField('coverImage', url)
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
```

**实现注意（必须遵守）：**
- `categories`/`tags` 下拉数据当前传空数组（`categories={[]}`/`tags={[]}`）——为控制本任务复杂度，**分类/标签的"已有列表"数据源由 Task 4 补充**（读取 content/posts 汇总，或读 data/categories.json），本任务先保证可运行
- `handleSave` 中 `form.datePrefixWas` 为占位判断——实现时删除该无效行（保持已有文件 date 字段原样：因为 `data` 从 `form.extra` 合并而来，未显式删除即保留）
- `writer-btn` 类在 writer.css 中未定义——实现时在 writer.css 补充 `.writer-btn` 样式（与 writer-input 同风格，cursor pointer）

- [ ] **Step 6: 修改 `client/src/App.jsx` 注册路由**

在 lazy 导入区增加一行：
```jsx
const WriterPage = lazy(() => import('./pages/WriterPage'))
```
在 `<Route path="/notes" .../>` 之后增加：
```jsx
          <Route path="/writer" element={<SuspenseWrapper><WriterPage /></SuspenseWrapper>} />
```
（放在 Layout 路由内部或外部均可——设计为独立全屏，建议放在 `<Route element={<Layout />}>` 之外、`<Route path="*">` 之前，与 /login 同级位置。）

- [ ] **Step 7: 修改 `client/src/main.jsx` 导入 writer.css**

在样式导入区增加：
```jsx
import './styles/writer.css'
```

- [ ] **Step 8: 语法检查与静态验证**

```bash
node --check E:\newblog\client\src\utils\slugify.js
node --check E:\newblog\client\src\utils\frontmatter.js
node --check E:\newblog\client\src\utils\file-system.js
```
（JSX 文件无法 node --check，用 read 复查关键逻辑。）

再验证 App.jsx 路由：
```bash
Select-String -Path E:\newblog\client\src\App.jsx -Pattern "writer"
```
预期：2 处（lazy import + Route）。

- [ ] **Step 9: 提交**

```bash
git -C E:\newblog add client/src/pages/WriterPage.jsx client/src/components/writer client/src/styles/writer.css client/src/App.jsx client/src/main.jsx
git -C E:\newblog commit -m "feat(writer): 写作工具页面，支持封面/标签/插图/预览/导入"
```

---

### Task 4: 分类标签数据源 + 全量验证 + 文档

**Files:**
- Modify: `client/src/pages/WriterPage.jsx`（分类/标签数据源）
- Modify: `AGENTS.md`（提及 /writer）
- Modify: `Docs/superpowers/plans/2026-08-14-writer-tool.md`（本文件，勾选完成项）

- [ ] **Step 1: WriterPage 接入分类/标签数据源**

修改 WriterPage：
1. 增加 `const [catTags, setCatTags] = useState({ categories: [], tags: [] })`
2. 在 `loadArticles` 成功后汇总：遍历所有文章 frontmatter，收集分类名与标签名集合（排序），`setCatTags({ categories: [...], tags: [...] })`——**不要读取 data/categories.json**（写作时内容目录才是权威，构建产物可能过期）
3. `WriterMetaForm` 的 `categories={catTags.categories}`、`tags={catTags.tags}`（值形如 `[{name, slug}]` 或字符串数组均可——MetaForm 中 `categories.map(c => c.name)` 与 `tags.map(t => t.name)` 按对象处理，数据源生成时统一为 `{name, slug}` 对象数组）

**实现要求：** MetaForm 中 `categories`/`tags` 的迭代代码使用 `c.name`/`t.name`/`t.slug`——若实现时改为字符串数组，需同步修改 MetaForm 迭代方式；二选一，保持一致即可。

- [ ] **Step 2: 全量验证**

```bash
cd E:\newblog\client && node scripts/build-content.mjs
```
预期：`✔ posts: 1, notes: 1, categories: 1, tags: 2`（回归不变）

```bash
node --check E:\newblog\client\src\utils\slugify.js
node --check E:\newblog\client\src\utils\frontmatter.js
node --check E:\newblog\client\src\utils\file-system.js
```

全项目残留检查：
```bash
Select-String -Path E:\newblog\client\src -Include *.js,*.jsx -Pattern "TODO|FIXME|datePrefixWas"
```
预期：无输出。

- [ ] **Step 3: 更新 `AGENTS.md`**

在「前端架构」一节追加：

```markdown
- `/writer` 隐藏路由：本地写作工具（Chrome/Edge）。选择 content/ 目录后可新建/编辑文章、设置封面/分类/标签、插入图片（自动复制到 content/images/）、导入 md、实时预览；保存自动生成文件名与 frontmatter
```

- [ ] **Step 4: 提交**

```bash
git -C E:\newblog add client/src/pages/WriterPage.jsx AGENTS.md
git -C E:\newblog commit -m "feat(writer): 分类标签数据源接入，文档更新"
```

- [ ] **Step 5: 收尾**

```bash
git -C E:\newblog status --short
git -C E:\newblog log --oneline main..feature | Select-Object -First 8
```

预期：工作区干净；feature 分支含本次 4 个 writer 提交。

---

## 自审记录

**Spec 覆盖检查**：设计 §3 文件系统（IndexedDB/权限/写文件）→ Task 2 ✓；§4 功能（列表/新建/编辑/元数据/封面/正文/插图/导入/保存）→ Task 3+4 ✓；§4 slugify 共享 → Task 1 ✓；§5 文件结构 → Task 2/3 ✓；§7 验证 → 各 Task 验证步骤 + 用户本机实测 ✓。

**遗留风险（实现时注意）**：
1. **File System Access 无法在沙箱实测**——所有交互逻辑（权限/写文件/粘贴）依赖用户本机 Chrome 验证；语法与解析器逻辑已静态验证
2. `handleSave` 的合并顺序逻辑（`extra` 保留未知字段 + 表单字段覆盖）是数据安全关键——实现时严格按 Task 3 Step 5 代码
3. `WriterPage` 行数接近 250 上限——实现时若超限，将 paste/insertImage 逻辑抽到 `utils/file-system.js` 或独立 hook，不要硬塞
4. MetaForm 的 `categories`/`tags` 数据形状需与 Task 4 数据源一致（对象数组 `{name, slug}`）
5. 编辑器预览中 `ArticleBody` 的 `onImageClick` 传空函数（工具内不需要灯箱）
