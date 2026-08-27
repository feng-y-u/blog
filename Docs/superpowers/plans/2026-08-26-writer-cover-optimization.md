# 写作工具封面优化（延迟复制 + 焦点调整）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 封面图改为保存时才写入 content/images/（换封面保存后清理旧图），并支持为封面设置显示焦点（拖拽 + 预设），全站封面渲染统一生效。

**Architecture:** 表单状态新增 `coverFile`（待落盘的压缩 Blob）与 `coverPosition`（object-position 字符串）。选封面只生成 blob URL 预览；`handleSave` 里先复制图片再写 frontmatter，替换封面时删除旧文件（被其他文章引用则保留）。焦点调整用新组件 `CoverFocalPicker`（480×180 裁切预览框 + 拖拽准星 + 顶部/居中/底部预设 + 重置），值存入 frontmatter `coverPosition`，构建脚本透传到 posts 数据，四处封面渲染点统一加 `objectPosition`。

**Tech Stack:** React 19 + Vite（client）；零依赖新增；封面渲染组件 PostCard / PostDetailPage / MagazineSpread / SearchResults。

**验证方式（项目约定替代 TDD）：** 本仓库无测试框架且 coding.md 禁止写测试。每个任务以 `cd client && npm run build`（先跑 build-content.mjs 再生 vite bundle）作为编译验证，最终以 Task 9 的人工 QA 清单验收。

**设计依据：** `Docs/superpowers/specs/2026-08-26-writer-cover-optimization-design.md`（已批准）。

---

### Task 1: 提取「图片是否被其他文章引用」公共函数

**Files:**
- Modify: `client/src/utils/file-system.js`（在 `deleteImage` 之后新增）
- Modify: `client/src/components/writer/ImageManager.jsx`（改用公共函数，删除内联检查）

- [ ] **Step 1: `file-system.js` 新增 `isImageReferencedElsewhere`**

在 `file-system.js` 的 `deleteImage` 函数之后追加：

```js
// True when any post file other than `exceptName` references `/images/<name>`.
// `exceptName` may be '' (e.g. an unsaved new article — no file to exclude).
export async function isImageReferencedElsewhere(postsDir, name, exceptName) {
  for (const pname of await listMarkdownFiles(postsDir)) {
    if (pname === exceptName) continue
    const raw = await readTextFile(postsDir, pname)
    if (raw.includes(`/images/${name}`)) return true
  }
  return false
}
```

- [ ] **Step 2: `ImageManager.jsx` 改用公共函数**

修改 `ImageManager.jsx`：

1. 顶部 import 改为：

```js
import { deleteImage, isImageReferencedElsewhere, revokeImageUrl } from '../../utils/file-system'
```

2. `handleRemove` 中，把原来 `postsDir` 循环检查（`const postsDir = await dir.getDirectoryHandle('posts')` 开始到 `if (usedElsewhere) {...} else {...}` 结束）整体替换为：

```js
      const postsDir = await dir.getDirectoryHandle('posts')
      const usedElsewhere = await isImageReferencedElsewhere(postsDir, name, form.name || '')
      if (usedElsewhere) {
        setNotice(`「${name}」仍被其他文章引用，已移除本文引用但保留文件`)
      } else {
        await deleteImage(dir, name)
        revokeImageUrl(name)
        setNotice(`已移除引用并删除文件「${name}」`)
      }
```

- [ ] **Step 3: 编译验证**

Run: `cd client && npm run build`
Expected: `✔ posts: 10, notes: 1, ...` 与 `✓ built in ...s`，无报错。

- [ ] **Step 4: 提交**

```bash
git add client/src/utils/file-system.js client/src/components/writer/ImageManager.jsx
git commit -m "refactor(writer): 提取图片是否被其他文章引用的公共检查"
```

---

### Task 2: useWriterArticle — coverFile 状态与保存流程

**Files:**
- Modify: `client/src/components/writer/useWriterArticle.js`

- [ ] **Step 1: 表单状态与 blob 引用**

1. import 行改为：

```js
import { readTextFile, writeTextFile, copyImageTo, deleteImage, revokeImageUrl, isImageReferencedElsewhere } from '../../utils/file-system'
```

2. `emptyForm()` 返回值增加两个字段（放在 `coverImage: ''` 后面）：

```js
    coverImage: '', coverFile: null, coverPosition: '',
```

3. hook 内新增一个 ref（放在 `lastSelRef` 声明后）：

```js
  const blobUrlRef = useRef(null)
```

4. 新增两个方法（放在 `onField` 之后）：

```js
  // Pick a new cover: preview via a blob URL, hold the compressed file for
  // the save step; cover focal position resets (it was tuned for the old image).
  function applyCover(blob) {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    const url = URL.createObjectURL(blob)
    blobUrlRef.current = url
    setCurrent(prev => ({ ...prev, coverImage: url, coverFile: blob, coverPosition: '' }))
    setDirty(true)
  }

  // Remove the cover: no file is ever written before save, so this only
  // releases the preview blob and clears the fields.
  function removeCover() {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    setCurrent(prev => ({ ...prev, coverImage: '', coverFile: null }))
    setDirty(true)
  }
```

- [ ] **Step 2: 切换/新建/导入时释放挂起 blob**

在 `handleSelect` 的 `setCurrent({` 之前插入：

```js
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
```

并且 `handleSelect` 的 `setCurrent` 对象里，在 `coverImage: data.coverImage || ''` 之后加 `coverFile: null,`、`coverPosition: data.coverPosition || '',`。

在 `handleNew` 的 `setCurrent(emptyForm())` 之前插入同样的 revoke 两行。

在 `handleImportMd` 的 `setCurrent({` 之前插入同样的 revoke 两行，且其 `setCurrent` 对象里在 `coverImage: data.coverImage || ''` 之后加 `coverFile: null,`、`coverPosition: data.coverPosition || '',`。

- [ ] **Step 3: 保存流程（复制 → 写文件 → 删旧图 → 清理）**

把 `handleSave` 函数整体替换为：

```js
  async function handleSave() {
    if (!dir) { setToast('请先打开 content 目录'); return }
    const form = current
    const title = form.title.trim() || form.slug || 'untitled'
    const slug = slugify(form.slug || form.title)
    let name = form.name
    const postsDir = await dir.getDirectoryHandle('posts', { create: true })
    if (form.isNew) {
      const dateSafe = /^\d{4}-\d{2}-\d{2}$/.test(form.date) ? form.date : TODAY
      name = `${dateSafe}-${slug}.md`
      let exists = true
      try {
        await postsDir.getFileHandle(name)
      } catch (err) {
        if (err?.name === 'NotFoundError') exists = false
        else throw err
      }
      if (exists) {
        if (!window.confirm(`文件 ${name} 已存在，覆盖？`)) return
      }
    }
    // Cover is written to content/images/ only now, when it is actually saved.
    let coverUrl = form.coverImage
    let copiedUrl = null
    if (form.coverFile) {
      try {
        copiedUrl = await copyImageTo(dir, form.coverFile)
        coverUrl = copiedUrl
      } catch (err) {
        setToast('封面上传失败: ' + err.message)
        return
      }
    }
    const oldCover = form.extra?.coverImage
    const data = { ...form.extra, title }
    if (form.category) data.category = form.category; else delete data.category
    if (form.tags.length) data.tags = form.tags; else delete data.tags
    if (coverUrl) data.coverImage = coverUrl; else delete data.coverImage
    if (form.coverPosition) data.coverPosition = form.coverPosition; else delete data.coverPosition
    if (form.excerpt) data.excerpt = form.excerpt; else delete data.excerpt
    if (form.jpChar) data.jpChar = form.jpChar; else delete data.jpChar
    // Note: existing `date` in form.extra stays untouched for edited files;
    // new files omit `date` entirely (the filename prefix carries it).
    const keys = ['title', ...(form.category ? ['category'] : []), ...(form.tags.length ? ['tags'] : []), ...(coverUrl ? ['coverImage'] : []), ...(form.coverPosition ? ['coverPosition'] : []), ...(form.excerpt ? ['excerpt'] : []), ...(form.jpChar ? ['jpChar'] : [])]
    const order = form.isNew ? keys : [...new Set([...form.order, ...keys])]
    const text = stringifyFrontmatter(data, order) + (form.content || '')
    setSaving(true)
    try {
      await writeTextFile(postsDir, name, text)
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
      setCurrent(prev => ({ ...prev, isNew: false, name, coverImage: copiedUrl || prev.coverImage, coverFile: null }))
      setDirty(false)
      setToast(`已保存 ${name}`)
      onSaved?.(dir)
      // Replacing the cover: delete the old file unless another post uses it.
      if (copiedUrl && oldCover && /^\/images\//.test(oldCover) && oldCover !== copiedUrl) {
        const oldName = decodeURIComponent(oldCover.replace(/^\/images\//, ''))
        try {
          if (await isImageReferencedElsewhere(postsDir, oldName, name)) {
            setToast(`已保存；旧封面被其他文章引用，文件「${oldName}」保留`)
          } else {
            await deleteImage(dir, oldName)
            revokeImageUrl(oldName)
          }
        } catch (err) {
          setToast(`已保存，但旧封面清理失败: ${err.message}`)
        }
      }
    } catch (err) {
      setToast('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
```

- [ ] **Step 4: 导出新方法**

`return` 对象增加 `applyCover, removeCover`：

```js
  return {
    current, dirty, saving, toast, setToast, textareaRef, rememberSelection,
    onField, applyCover, removeCover, handleSelect, handleNew, handleImportMd,
    handleSave, insertImage,
  }
```

- [ ] **Step 5: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 6: 提交**

```bash
git add client/src/components/writer/useWriterArticle.js
git commit -m "feat(writer): 封面延迟到保存时复制，替换封面后清理旧图"
```

---

### Task 3: WriterPage — 选封面改为预览

**Files:**
- Modify: `client/src/pages/WriterPage.jsx`

- [ ] **Step 1: 调整 import 与解构**

1. `import { pickContentDir, restoreContentDir, ensureWritePermission, listMarkdownFiles, readTextFile, copyImageTo } from '../utils/file-system'` 中移除 `copyImageTo`，改为：

```js
import {
  pickContentDir, restoreContentDir, ensureWritePermission, listMarkdownFiles, readTextFile,
} from '../utils/file-system'
```

2. `const { current, dirty, saving, toast, setToast, textareaRef, rememberSelection, onField, handleSelect, handleNew, handleImportMd, handleSave, insertImage } = article` 改为：

```js
  const { current, dirty, saving, toast, setToast, textareaRef, rememberSelection, onField, applyCover, removeCover, handleSelect, handleNew, handleImportMd, handleSave, insertImage } = article
```

- [ ] **Step 2: onPickCover 不再落盘**

`onPickCover` 回调整体替换为：

```jsx
              onPickCover={async e => {
                const f = e.target.files?.[0]
                if (f) {
                  if (dir) {
                    try {
                      applyCover(await compressImage(f))
                    } catch (err) {
                      setToast('图片处理失败: ' + err.message)
                    }
                  } else {
                    setToast('请先打开 content 目录')
                  }
                }
                e.target.value = ''
              }}
              onRemoveCover={removeCover}
```

- [ ] **Step 3: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 4: 提交**

```bash
git add client/src/pages/WriterPage.jsx
git commit -m "feat(writer): 选中封面仅预览，保存时才写入 content"
```

---

### Task 4: 新增 CoverFocalPicker 组件

**Files:**
- Create: `client/src/components/writer/CoverFocalPicker.jsx`

- [ ] **Step 1: 创建组件**

```jsx
import { useRef } from 'react'

// Parses an object-position value ("50% 30%") into [x, y] percentages;
// anything else (empty, "top", ...) falls back to center.
function parsePos(v) {
  const m = String(v || '').match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
  return m ? [Number(m[1]), Number(m[2])] : [50, 50]
}

const PRESETS = [
  ['顶部', '50% 0%'],
  ['居中', '50% 50%'],
  ['底部', '50% 100%'],
]

// Cover focal-point adjuster: a card-proportioned (8:3) crop preview with a
// draggable crosshair plus preset buttons. Emits object-position strings.
export default function CoverFocalPicker({ src, value, onChange }) {
  const [x, y] = parsePos(value)
  const boxRef = useRef(null)
  const draggingRef = useRef(false)

  function moveTo(clientX, clientY) {
    const rect = boxRef.current.getBoundingClientRect()
    const px = Math.round(((clientX - rect.left) / rect.width) * 100)
    const py = Math.round(((clientY - rect.top) / rect.height) * 100)
    onChange(`${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%`)
  }

  return (
    <div>
      <div
        ref={boxRef}
        style={{
          position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '8 / 3',
          overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)',
          cursor: 'crosshair', userSelect: 'none', touchAction: 'none', background: 'var(--bg)',
        }}
        onPointerDown={e => { draggingRef.current = true; moveTo(e.clientX, e.clientY) }}
        onPointerMove={e => { if (draggingRef.current) moveTo(e.clientX, e.clientY) }}
        onPointerUp={() => { draggingRef.current = false }}
        onPointerLeave={() => { draggingRef.current = false }}
      >
        <img src={src} alt="焦点预览" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: `${x}% ${y}%`, display: 'block', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, width: 18, height: 18,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(0,0,0,0.4)',
          background: 'rgba(232,93,138,0.55)', pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {PRESETS.map(([label, p]) => (
          <button key={label} type="button" className="writer-btn"
            style={{ cursor: 'pointer', background: value === p ? 'var(--accent-dim)' : 'var(--surface)' }}
            onClick={() => onChange(p)}>{label}</button>
        ))}
        <button type="button" className="writer-btn"
          style={{ cursor: 'pointer', background: 'var(--surface)' }}
          onClick={() => onChange('50% 50%')}>重置</button>
        <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>焦点：{x}% {y}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/components/writer/CoverFocalPicker.jsx
git commit -m "feat(writer): 新增封面焦点调整组件（拖拽 + 预设）"
```

---

### Task 5: WriterMetaForm 接入焦点调整与移除封面

**Files:**
- Modify: `client/src/components/writer/WriterMetaForm.jsx`

- [ ] **Step 1: import 与 props**

1. 顶部新增：

```js
import CoverFocalPicker from './CoverFocalPicker'
```

2. 签名 `export default function WriterMetaForm({ form, categories, tags, onField, onPickCover, coverInputRef, dir })` 增加 `onRemoveCover`：

```js
export default function WriterMetaForm({ form, categories, tags, onField, onPickCover, onRemoveCover, coverInputRef, dir }) {
```

- [ ] **Step 2: 封面字段区**

把封面字段块（`<label>封面</label>` 的整个 `.writer-field full` div 内）的「移除」按钮与预览缩略图区域替换为：

```jsx
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="writer-btn" style={btn} onClick={() => coverInputRef.current?.click()}>选择封面图片</button>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickCover} />
          {form.coverImage && (
            <>
              <img src={coverSrc} alt="封面预览" style={{ height: '48px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              <button className="writer-btn" style={btn} onClick={onRemoveCover}>移除</button>
            </>
          )}
        </div>
        {form.coverImage && (
          <div style={{ marginTop: '10px' }}>
            <CoverFocalPicker src={coverSrc} value={form.coverPosition} onChange={v => onField('coverPosition', v)} />
          </div>
        )}
```

- [ ] **Step 3: 卡片预览携带焦点**

`WriterMetaForm` 底部 PostCard 预览的 `post` 对象，在 `coverImage: form.coverImage ? coverSrc : null,` 后加一行：

```js
            coverPosition: form.coverPosition || undefined,
```

- [ ] **Step 4: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 5: 提交**

```bash
git add client/src/components/writer/WriterMetaForm.jsx
git commit -m "feat(writer): 表单接入封面焦点调整与延迟移除"
```

---

### Task 6: 构建脚本透传 coverPosition

**Files:**
- Modify: `client/scripts/build-content.mjs`

- [ ] **Step 1: posts 数据增加字段**

posts map 的返回对象里，`coverImage: data.coverImage || data.cover || null,` 之后加一行：

```js
    coverPosition: data.coverPosition || null,
```

- [ ] **Step 2: 重新构建数据**

Run: `cd client && npm run build`
Expected: `✔ posts: 10, notes: 1, ...`；`client/public/data/` 下 posts.json 中已设置焦点的文章出现 `"coverPosition"` 字段。

- [ ] **Step 3: 提交**

```bash
git add client/scripts/build-content.mjs
git commit -m "chore(scripts): 封面焦点字段透传到构建数据"
```

---

### Task 7: PostCard 应用封面焦点

**Files:**
- Modify: `client/src/components/PostCard.jsx`

- [ ] **Step 1: cover img 加 objectPosition**

`PostCard` 的封面 img 改为：

```jsx
      {post.coverImage && (
        <div className="post-card-cover">
          <img src={post.coverImage} alt="" loading="lazy" style={post.coverPosition ? { objectPosition: post.coverPosition } : undefined} />
        </div>
      )}
```

- [ ] **Step 2: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 3: 提交**

```bash
git add client/src/components/PostCard.jsx
git commit -m "feat(ui): 卡片封面支持焦点位置"
```

---

### Task 8: 文章头图 / 杂志 / 搜索封面应用焦点

**Files:**
- Modify: `client/src/pages/PostDetailPage.jsx`（约 113-115 行 hero img）
- Modify: `client/src/components/MagazineSpread.jsx`（约 96-112 行封面 img 的 style 对象）
- Modify: `client/src/components/SearchResults.jsx`（约 46-50 行缩略图 img）

- [ ] **Step 1: PostDetailPage hero**

```jsx
          {post.coverImage && (
            <img src={post.coverImage} alt="" className="article-hero" style={post.coverPosition ? { objectPosition: post.coverPosition } : undefined} />
          )}
```

- [ ] **Step 2: MagazineSpread 封面**

封面 `<img>` 的 style 对象（含 objectFit: 'cover' 的那个）中，`objectFit: 'cover',` 后加一行：

```js
                objectPosition: post.coverPosition || undefined,
```

- [ ] **Step 3: SearchResults 缩略图**

```jsx
            {post.coverImage && (
              <div className="post-card-cover">
                <img src={post.coverImage} alt="" loading="lazy" style={post.coverPosition ? { objectPosition: post.coverPosition } : undefined} />
              </div>
            )}
```

- [ ] **Step 4: 编译验证**

Run: `cd client && npm run build`
Expected: 构建成功，无报错。

- [ ] **Step 5: 提交**

```bash
git add client/src/pages/PostDetailPage.jsx client/src/components/MagazineSpread.jsx client/src/components/SearchResults.jsx
git commit -m "feat(ui): 文章头图/杂志/搜索封面支持焦点位置"
```

---

### Task 9: 整体验证（人工 QA 清单）

**Files:** 无代码改动；仅验证。

- [ ] **Step 1: 完整构建**

Run: `cd client && npm run build`
Expected: 构建成功。

- [ ] **Step 2: 人工 QA 清单（Chrome/Edge 打开 /writer）**

1. 新建文章 → 选封面：`content/images/` 目录**不出现**新文件；表单内有预览。
2. 选完封面点「移除」：磁盘无文件产生。
3. 新建文章选封面 A → 保存：`content/images/` 出现 A 的压缩副本，frontmatter 写 `coverImage: /images/...`。
4. 打开该文章 → 再选封面 B → 保存：出现 B；A 文件被删除（若 A 未被其他文章引用）。
5. 已保存文章：直接点「移除」再保存 → 字段删除，文件保留（用「本文章片」可删）。
6. 封面焦点：拖动准星/点预设 → 下方 PostCard 预览立即变化；保存后 frontmatter 出现 `coverPosition`（如 `50% 30%`）。
7. 站点渲染：首页卡片、文章页头图、搜索缩略图、杂志态（首页滚动区）均按 `coverPosition` 显示；未设焦点的文章保持居中不变。
8. 换封面后焦点重置为居中（旧焦点不沿用）。
9. 多次选封面/移除/保存后无预览图残留（blob URL 已释放，浏览器内存平稳）。

- [ ] **Step 3: 收尾**

无代码变更则不提交；若有验证中发现的需要修复项，逐项修复并提交。

---

## 自审记录

- **Spec 覆盖**：①选封面不落盘（Task 2/3）✅ ②保存时复制（Task 2）✅ ③换封面删旧图且保留被引用图（Task 2）✅ ④移除封面不删文件（Task 2 removeCover + handleSave 无删除分支）✅ ⑤coverPosition 数据链路（Task 2/6）✅ ⑥四处渲染点（Task 7/8）✅ ⑦CoverFocalPicker 拖拽+预设+重置（Task 4）✅ ⑧换封面重置焦点（Task 2 applyCover 清空 coverPosition）✅ ⑨blob URL 生命周期（Task 2）✅
- **占位符扫描**：无 TBD/TODO；所有代码步骤给出完整代码。
- **一致性**：`applyCover`/`removeCover`/`coverFile`/`coverPosition` 命名全程一致；`isImageReferencedElsewhere(postsDir, name, exceptName)` 签名在 Task 1 定义、Task 2/ImageManager 使用一致。