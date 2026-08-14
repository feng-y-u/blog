# 纯静态化改造实施计划（Cloudflare Pages）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 feature 分支的博客改造为无后端纯静态站点（内容 = Markdown 文件，构建时生成数据 JSON，前端 SPA 读取），部署到 Cloudflare Pages。

**Architecture:** 保留现有 React SPA 全部前台 UI；新增 `content/` 内容目录与 `client/scripts/build-content.mjs` 构建脚本（解析 md → 生成 `client/public/data/*.json` + sitemap/robots + 复制图片）；前端 api 层从 axios 改为读取本地 JSON 并保持 `{data, pagination}` 返回形状（页面改动最小化）；删除后台/登录/评论及对应依赖；`wrangler pages deploy client/dist` 部署。

**Tech Stack:** Node 18+（脚本）、gray-matter（frontmatter 解析，devDependency）、Vite、React 19、react-router-dom v6。项目无测试基础设施（coding.md 禁止），验证方式：`node --check` 语法检查 + 构建脚本实跑断言 + grep 残留检查 + 用户本机 `npm run build`/dev 验证。

**设计文档：** `Docs/superpowers/specs/2026-08-14-static-site-design.md`

**工作分支：** `feature`（当前分支）

---

### Task 1: 内容目录与示例内容

**Files:**
- Create: `content/config.json`
- Create: `content/posts/2026-08-14-你好博客.md`
- Create: `content/notes/2026-08-14-示例笔记.md`

- [ ] **Step 1: 创建 `content/config.json`**

```json
{
  "site_title": "风予'S BLOG",
  "site_subtitle": "代码与动漫的世界",
  "banner_image": "",
  "avatar_emoji": "🌸",
  "profile_name": "风予",
  "profile_signature": "写代码，看动漫",
  "profile_bio": "个人博客，分享编程技术和动漫文化",
  "social_links": "{\"github\":\"https://github.com/xxx\"}"
}
```

（`social_links` 为 JSON 字符串，与前端 `JSON.parse(settings?.social_links ?? '{}')` 兼容。）

- [ ] **Step 2: 创建 `content/posts/2026-08-14-你好博客.md`（frontmatter 全量示例，验证可选性）**

```markdown
---
title: 你好，博客
category: 技术
tags: [react, vite]
cover: /images/cover.jpg
excerpt: 静态化后的第一篇文章
jpChar: 博
---

# 你好，博客

这是一篇示例文章，用于验证静态化构建流程。
```

- [ ] **Step 3: 创建 `content/notes/2026-08-14-示例笔记.md`（无 frontmatter，验证自动推导）**

```markdown
# 示例笔记

- 要点一
- 要点二
```

- [ ] **Step 4: 提交**

```bash
git add content/
git commit -m "feat(content): 内容目录结构与示例文章"
```

---

### Task 2: 构建脚本 `client/scripts/build-content.mjs`

**Files:**
- Create: `client/scripts/build-content.mjs`
- Modify: `client/package.json`（scripts + devDependencies）
- Modify: `client/package-lock.json`（由 npm install 生成）

- [ ] **Step 1: 安装 gray-matter**

```bash
cd client && npm install -D gray-matter --no-audit --no-fund
```

预期：package.json devDependencies 增加 `"gray-matter": "^4.0.3"`。

- [ ] **Step 2: 创建 `client/scripts/build-content.mjs`（完整脚本）**

```js
import { readdir, readFile, mkdir, copyFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'client/public')

// Same rules as the old server slugify (keeps CJK).
function slugify(text) {
  let slug = String(text).toLowerCase().trim()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'untitled'
}

function parseDateFromFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})[-_]/)
  return m ? m[1] : null
}

async function loadMarkdownFiles(dir) {
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter(f => f.isFile() && f.name.endsWith('.md'))
    .sort()
  const items = []
  for (const f of files) {
    const raw = await readFile(path.join(dir, f.name), 'utf-8')
    const { data, content } = matter(raw)
    const base = f.name.replace(/\.md$/, '')
    const datePrefix = parseDateFromFilename(base)
    const slug = datePrefix ? base.slice(datePrefix.length + 1) : base
    const title = data.title || content.match(/^#\s+(.+)$/m)?.[1]?.trim() || slug
    const fileStat = await stat(path.join(dir, f.name))
    const date = datePrefix || data.date || fileStat.mtime.toISOString().slice(0, 10)
    items.push({ slug, title, date, data, content })
  }
  return items
}

// --- build posts ---
const postFiles = await loadMarkdownFiles(path.join(contentDir, 'posts'))
const categoryNames = new Set()
const tagNames = new Set()
const seenSlugs = new Set()
const posts = postFiles.map(({ slug, title, date, data, content }) => {
  if (seenSlugs.has(slug)) throw new Error(`重复的 slug: ${slug}`)
  seenSlugs.add(slug)
  const categoryName = data.category || null
  if (categoryName) categoryNames.add(categoryName)
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  tags.forEach(t => tagNames.add(t))
  return {
    slug,
    title,
    publishedAt: new Date(date + 'T00:00:00Z').toISOString(),
    category: categoryName ? { name: categoryName, slug: slugify(categoryName) } : null,
    tags: tags.map(t => ({ name: t, slug: slugify(t) })),
    coverImage: data.coverImage || data.cover || null,
    excerpt: data.excerpt || content.replace(/^#\s+.+$/m, '').replace(/[#*`\[\]()>|\\-]/g, '').trim().slice(0, 120),
    jpChar: data.jpChar || null,
    content,
    viewCount: 0,
  }
}).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

const categories = [...categoryNames].map(name => ({
  name,
  slug: slugify(name),
  description: null,
  _count: { posts: posts.filter(p => p.category?.name === name).length },
}))

const tags = [...tagNames].map(name => ({
  name,
  slug: slugify(name),
  _count: { posts: posts.filter(p => p.tags?.some(t => t.name === name)).length },
}))

// --- build notes ---
const noteFiles = await loadMarkdownFiles(path.join(contentDir, 'notes'))
const seenNoteSlugs = new Set()
const notes = noteFiles.map(({ slug, title, date, data, content }) => {
  if (seenNoteSlugs.has(slug)) throw new Error(`重复的笔记 slug: ${slug}`)
  seenNoteSlugs.add(slug)
  const categoryName = data.category || null
  if (categoryName && !categoryNames.has(categoryName)) {
    // notes may introduce their own categories only if also used by posts; else skip
  }
  return {
    slug,
    title,
    updatedAt: new Date(date + 'T00:00:00Z').toISOString(),
    category: categoryName ? { name: categoryName, slug: slugify(categoryName) } : null,
    content,
  }
}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

// --- settings ---
let settings = {}
try {
  settings = JSON.parse(await readFile(path.join(contentDir, 'config.json'), 'utf-8'))
} catch (e) {
  console.warn('config.json 缺失或非法，使用空设置')
}

// --- write outputs ---
await mkdir(path.join(publicDir, 'data'), { recursive: true })
await writeFile(path.join(publicDir, 'data/posts.json'), JSON.stringify(posts))
await writeFile(path.join(publicDir, 'data/notes.json'), JSON.stringify(notes))
await writeFile(path.join(publicDir, 'data/categories.json'), JSON.stringify(categories))
await writeFile(path.join(publicDir, 'data/tags.json'), JSON.stringify(tags))
await writeFile(path.join(publicDir, 'data/settings.json'), JSON.stringify(settings))

// --- copy images ---
await mkdir(path.join(publicDir, 'images'), { recursive: true })
const imagesSrc = path.join(contentDir, 'images')
try {
  const files = await readdir(imagesSrc, { withFileTypes: true })
  for (const f of files) {
    if (f.isFile()) await copyFile(path.join(imagesSrc, f.name), path.join(publicDir, 'images', f.name))
  }
} catch { /* no images dir, skip */ }

// --- sitemap + robots ---
const siteUrl = settings.site_url || 'https://example.com'
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sm += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`
for (const p of posts) sm += `  <url><loc>${siteUrl}/post/${p.slug}</loc><lastmod>${p.publishedAt.slice(0, 10)}</lastmod><priority>0.9</priority></url>\n`
for (const c of categories) sm += `  <url><loc>${siteUrl}/category/${c.slug}</loc><priority>0.8</priority></url>\n`
for (const t of tags) sm += `  <url><loc>${siteUrl}/tag/${t.slug}</loc><priority>0.7</priority></url>\n`
sm += `  <url><loc>${siteUrl}/notes</loc><priority>0.7</priority></url>\n</urlset>`
await writeFile(path.join(publicDir, 'sitemap.xml'), sm)
await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)

console.log(`✔ posts: ${posts.length}, notes: ${notes.length}, categories: ${categories.length}, tags: ${tags.length}`)
```

**注意：** 脚本输出字段名与前端组件现有字段完全一致（`publishedAt`/`updatedAt`/`coverImage`/`jpChar`/`category`/`tags`），保证页面零改动。

- [ ] **Step 3: 修改 `client/package.json` scripts**

```json
"scripts": {
  "dev": "node scripts/build-content.mjs && vite",
  "build": "node scripts/build-content.mjs && vite build",
  "preview": "vite preview"
}
```

- [ ] **Step 4: 运行脚本验证输出**

```bash
cd client && node scripts/build-content.mjs
```

预期输出：`✔ posts: 1, notes: 1, categories: 1, tags: 2`
再验证生成文件内容：

```bash
node -e "const p=require('./public/data/posts.json'); console.log(p[0].slug, p[0].title, p[0].category, p[0].tags.map(t=>t.slug), p[0].publishedAt)"
```

预期：`你好博客 你好，博客 { name: '技术', slug: '技术' } [ 'react', 'vite' ] 2026-08-14T00:00:00.000Z`

```bash
node -e "const n=require('./public/data/notes.json'); console.log(n[0].slug, n[0].title)"
```

预期：`示例笔记 示例笔记`（标题从 H1 推导）

- [ ] **Step 5: 提交**

```bash
git add client/scripts client/package.json client/package-lock.json
git commit -m "feat(static): 内容构建脚本，md解析为数据JSON"
```

---

### Task 3: 构建产物忽略与 Vite 配置清理

**Files:**
- Modify: `.gitignore`
- Modify: `client/vite.config.js`

- [ ] **Step 1: `.gitignore` 追加**

```gitignore
# Static build artifacts
client/public/data/
client/public/images/
client/public/sitemap.xml
client/public/robots.txt
```

- [ ] **Step 2: 修改 `client/vite.config.js`，删除 `/api`、`/uploads` proxy（保留 react 插件与 manualChunks）**

删除后的期望内容（proxy 整体移除，其余保持原样）：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-highlight'],
        },
      },
    },
  },
})
```

（先读现有 `client/vite.config.js`，仅删 proxy 段，保留其余配置不变。）

- [ ] **Step 3: 验证 git 忽略生效**

```bash
git check-ignore client/public/data/posts.json client/public/images client/public/sitemap.xml
```

预期：4 行路径全部输出（表示已忽略）。

- [ ] **Step 4: 提交**

```bash
git add .gitignore client/vite.config.js
git commit -m "chore(static): 忽略构建产物，清理vite代理配置"
```

---

### Task 4: 前端数据层重写（本地 JSON + 前端过滤）

**Files:**
- Create: `client/src/api/loader.js`
- Modify: `client/src/api/posts.js`（重写）
- Modify: `client/src/api/categories.js`（重写）
- Modify: `client/src/api/tags.js`（重写）
- Modify: `client/src/api/note.js`（重写）
- Modify: `client/src/api/settings.js`（重写）
- Delete: `client/src/api/client.js`、`client/src/api/auth.js`、`client/src/api/upload.js`、`client/src/api/comments.js`

- [ ] **Step 1: 创建 `client/src/api/loader.js`**

```js
// Loads static JSON from /data/* with promise caching (each path fetched once).
const cache = new Map()

export function loadJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then(res => {
      if (!res.ok) throw new Error(`加载 ${path} 失败: ${res.status}`)
      return res.json()
    }))
  }
  return cache.get(path)
}
```

- [ ] **Step 2: 重写 `client/src/api/posts.js`（完整内容）**

```js
import { loadJson } from './loader'

let postsPromise = null
const posts = () => (postsPromise ??= loadJson('/data/posts.json'))

// Keep the legacy response shape { data: { data, pagination } } so pages stay unchanged.
export async function getPosts(params = {}) {
  const all = await posts()
  const { page = 1, limit = 3, category, tag, search } = params
  let list = all
  if (category) list = list.filter(p => p.category?.slug === category)
  if (tag) list = list.filter(p => p.tags?.some(t => t.slug === tag))
  if (search) {
    const q = String(search).toLowerCase()
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
  }
  const total = list.length
  const safePage = Math.max(+page || 1, 1)
  const safeLimit = Math.min(Math.max(+limit || 3, 1), 100)
  const start = (safePage - 1) * safeLimit
  return {
    data: {
      data: list.slice(start, start + safeLimit),
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    },
  }
}

export async function getPostBySlug(slug) {
  const all = await posts()
  const post = all.find(p => p.slug === slug) || null
  return { data: { data: post } }
}

export async function getAdjacentPosts() {
  const all = await posts()
  // Computed by PostDetailPage via currentIndex instead (see Task 5 Step 2).
  return { data: { data: { prev: null, next: null } } }
}
```

- [ ] **Step 3: 重写 `client/src/api/categories.js`（完整内容）**

```js
import { loadJson } from './loader'

let categoriesPromise = null
const categories = () => (categoriesPromise ??= loadJson('/data/categories.json'))

export async function getCategories() {
  return { data: { data: await categories() } }
}

export async function getCategoryBySlug(slug) {
  const all = await categories()
  return { data: { data: all.find(c => c.slug === slug) || null } }
}
```

- [ ] **Step 4: 重写 `client/src/api/tags.js`（完整内容）**

```js
import { loadJson } from './loader'

let tagsPromise = null
const tags = () => (tagsPromise ??= loadJson('/data/tags.json'))

export async function getTags() {
  return { data: { data: await tags() } }
}
```

- [ ] **Step 5: 重写 `client/src/api/note.js`（完整内容）**

```js
import { loadJson } from './loader'

let notesPromise = null
const notes = () => (notesPromise ??= loadJson('/data/notes.json'))

async function list(params = {}) {
  const all = await notes()
  const { page = 1, limit = 20, categoryId } = params
  let list = all
  if (categoryId) list = list.filter(n => n.category?.slug === categoryId)
  const total = list.length
  const safePage = Math.max(+page || 1, 1)
  const safeLimit = Math.min(Math.max(+limit || 20, 1), 100)
  const start = (safePage - 1) * safeLimit
  return {
    data: {
      data: list.slice(start, start + safeLimit),
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    },
  }
}

export const getNotes = list
export const getPublicNotes = list
```

- [ ] **Step 6: 重写 `client/src/api/settings.js`（完整内容）**

```js
import { loadJson } from './loader'

let settingsPromise = null
export async function getSettings() {
  settingsPromise ??= loadJson('/data/settings.json')
  return { data: { data: await settingsPromise } }
}
```

- [ ] **Step 7: 删除 `client/src/api/client.js`、`auth.js`、`upload.js`、`comments.js`**

```bash
git rm client/src/api/client.js client/src/api/auth.js client/src/api/upload.js client/src/api/comments.js
```

- [ ] **Step 8: 语法检查与残留检查**

```bash
node --check client/src/api/loader.js
node --check client/src/api/posts.js
node --check client/src/api/categories.js
node --check client/src/api/tags.js
node --check client/src/api/note.js
node --check client/src/api/settings.js
```

全部预期 `0 错误`。再 grep 确认无残留引用：

```bash
grep -rn "api/client\|api/auth\|api/upload\|api/comments" client/src --include=*.jsx --include=*.js
```

预期：无输出（CommentSection 将在 Task 6 删除，若此处 grep 命中 CommentSection 属预期，Task 6 处理）。

- [ ] **Step 9: 提交**

```bash
git add -A client/src/api
git commit -m "refactor(api): 数据层改为读取本地JSON，前端过滤"
```

---

### Task 5: 页面兼容适配（id→slug、相邻文章、作者名、浏览量）

**Files:**
- Modify: `client/src/pages/PostDetailPage.jsx`
- Modify: `client/src/pages/CategoryPage.jsx`
- Modify: `client/src/pages/TagPage.jsx`
- Modify: `client/src/pages/NotesPage.jsx`
- Modify: `client/src/components/RestPosts.jsx`
- Modify: `client/src/components/SearchModal.jsx`
- Modify: `client/src/components/SearchResults.jsx`
- Modify: `client/src/components/MagazinePage.jsx`

- [ ] **Step 1: 列表 key 统一改为 slug**

逐个替换（均为 `key={post.id}` → `key={post.slug}`；NotesPage 为 `key={note.id}` → `key={note.slug}`）：
- `CategoryPage.jsx:55`、`TagPage.jsx:50`、`RestPosts.jsx:17`、`SearchModal.jsx:133`、`SearchResults.jsx:45`、`MagazinePage.jsx:11` 与 `:60`、`NotesPage.jsx:36`

（日期/封面字段无需改动：构建脚本已输出 `publishedAt`/`updatedAt`/`coverImage`，与组件现有引用一致。）

- [ ] **Step 2: PostDetailPage 重写数据流（完整文件替换）**

```jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getPostBySlug, getPosts } from '../api/posts'
import { useSettings } from '../contexts/SettingsContext'
import Loading from '../components/Loading'
import ReadingProgress from '../components/ReadingProgress'
import Lightbox from '../components/Lightbox'
import ArticleMeta from '../components/ArticleMeta'
import ArticleToolbar from '../components/ArticleToolbar'
import TableOfContents, { extractTOC } from '../components/TableOfContents'
import ArticleBody from '../components/ArticleBody'
import ArticleFooter from '../components/ArticleFooter'
import AdjacentNav from '../components/AdjacentNav'

const FONT_SIZES = { small: '15px', medium: '16px', large: '19px' }
function getInitialFontSize() {
  return typeof window !== 'undefined' ? localStorage.getItem('article-font') || 'medium' : 'medium'
}
function getLocalViews(slug) {
  if (typeof window === 'undefined') return 0
  const key = `article-views-${slug}`
  const n = Number(localStorage.getItem(key) || 0)
  localStorage.setItem(key, String(n + 1))
  return n + 1
}

export default function PostDetailPage() {
  const { slug } = useParams()
  const { settings } = useSettings()
  const [post, setPost] = useState(null)
  const [adjacent, setAdjacent] = useState({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fontSize, setFontSize] = useState(getInitialFontSize)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [localViews, setLocalViews] = useState(0)
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fav-posts') || '[]') } catch { return [] }
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getPostBySlug(slug), getPosts({ limit: 100 })])
      .then(([postRes, allRes]) => {
        if (cancelled) return
        const p = postRes.data.data
        if (!p) { setError('文章不存在'); return }
        setPost(p)
        setLocalViews(getLocalViews(p.slug))
        const list = allRes.data.data
        const idx = list.findIndex(x => x.slug === p.slug)
        setAdjacent({
          prev: idx > 0 ? list[idx - 1] : null,
          next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
        })
      })
      .catch(err => { if (!cancelled) setError(err.message || '文章不存在') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    document.documentElement.style.setProperty('--article-font-size', FONT_SIZES[fontSize])
    localStorage.setItem('article-font', fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('fav-posts', JSON.stringify(favorites))
  }, [favorites])

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleToggleFavorite() {
    if (!post) return
    setFavorites(prev => prev.includes(post.slug) ? prev.filter(s => s !== post.slug) : [...prev, post.slug])
  }

  if (loading) return <Loading />
  if (error) return <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--accent-pink)' }}>{error}</div>
  if (!post) return null

  const isFavorited = favorites.includes(post.slug)
  const headings = extractTOC(post.content)

  return (
    <>
      <Helmet>
        <title>{post.title} — Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>
      <ReadingProgress />
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <article className="article-container">
        <ArticleMeta category={post.category} publishedAt={post.publishedAt} contentLength={post.content?.length} />
        <h1 className="article-title">{post.title}</h1>
        <ArticleToolbar author={settings?.profile_name || ''} viewCount={localViews} fontSize={fontSize} onFontSizeChange={setFontSize} />
        <TableOfContents headings={headings} />
        <ArticleBody content={post.content} onImageClick={setLightboxSrc} />
        <ArticleFooter tags={post.tags} isFavorited={isFavorited} onToggleFavorite={handleToggleFavorite} onCopyLink={handleCopyLink} copied={copied} />
      </article>
      <AdjacentNav prev={adjacent.prev} next={adjacent.next} />
    </>
  )
}
```

- [ ] **Step 3: 提交**

```bash
git add client/src/pages/PostDetailPage.jsx client/src/pages/CategoryPage.jsx client/src/pages/TagPage.jsx client/src/pages/NotesPage.jsx client/src/components/RestPosts.jsx client/src/components/SearchModal.jsx client/src/components/SearchResults.jsx client/src/components/MagazinePage.jsx
git commit -m "refactor(static): 页面适配静态数据形状（slug键/相邻文章/本地浏览量）"
```

---

### Task 6: 删除后台、评论、样式与依赖

**Files:**
- Delete: `client/src/pages/admin/`（9 个文件）、`client/src/pages/LoginPage.jsx`、`client/src/components/AdminLayout.jsx`、`client/src/components/CommentSection.jsx`、`client/src/components/ConfirmModal.jsx`、`client/src/components/AdminToast.jsx`、`client/src/styles/admin.css`
- Modify: `client/src/App.jsx`（删路由）、`client/src/main.jsx`（删 admin.css 导入）
- Modify: `client/package.json`（移除依赖）

- [ ] **Step 1: 删除文件**

```bash
git rm -r client/src/pages/admin client/src/pages/LoginPage.jsx client/src/components/AdminLayout.jsx client/src/components/CommentSection.jsx client/src/components/ConfirmModal.jsx client/src/components/AdminToast.jsx client/src/styles/admin.css
```

- [ ] **Step 2: 重写 `client/src/App.jsx`（完整内容）**

```jsx
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import Loading from './components/Loading'
import { SettingsProvider } from './contexts/SettingsContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const CategoryListPage = lazy(() => import('./pages/CategoryListPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const TagCloudPage = lazy(() => import('./pages/TagCloudPage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function SuspenseWrapper({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>
}

export default function App() {
  return (
    <HelmetProvider>
      <SettingsProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SuspenseWrapper><HomePage /></SuspenseWrapper>} />
          <Route path="/post/:slug" element={<SuspenseWrapper><PostDetailPage /></SuspenseWrapper>} />
          <Route path="/categories" element={<SuspenseWrapper><CategoryListPage /></SuspenseWrapper>} />
          <Route path="/category/:slug" element={<SuspenseWrapper><CategoryPage /></SuspenseWrapper>} />
          <Route path="/tags" element={<SuspenseWrapper><TagCloudPage /></SuspenseWrapper>} />
          <Route path="/tag/:slug" element={<SuspenseWrapper><TagPage /></SuspenseWrapper>} />
          <Route path="/search" element={<SuspenseWrapper><SearchPage /></SuspenseWrapper>} />
          <Route path="/notes" element={<SuspenseWrapper><NotesPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
      </SettingsProvider>
    </HelmetProvider>
  )
}
```

- [ ] **Step 3: 修改 `client/src/main.jsx`，删除 admin.css 导入行**

删除 `import './styles/admin.css'`（保留其余 7 个样式导入）。

- [ ] **Step 4: 移除依赖**

```bash
cd client && npm uninstall axios @blocknote/core @blocknote/mantine @blocknote/react @mantine/core @mantine/hooks @mantine/notifications --no-audit --no-fund
```

预期：package.json dependencies 仅剩 `gsap`、`react`、`react-dom`、`react-helmet-async`、`react-markdown`、`react-router-dom`、`rehype-highlight`、`remark-gfm`。

- [ ] **Step 5: 残留检查**

```bash
grep -rn "CommentSection\|AdminLayout\|LoginPage\|admin/\|admin.css\|/login\|blocknote\|mantine\|axios" client/src --include=*.jsx --include=*.js
```

预期：无输出。

- [ ] **Step 6: 提交**

```bash
git add -A client
git commit -m "feat(static): 移除后台/登录/评论及对应依赖"
```

---

### Task 7: Cloudflare Pages 部署配置

**Files:**
- Create: `client/public/_redirects`
- Create: `client/public/_headers`

- [ ] **Step 1: 创建 `client/public/_redirects`**

```
/* /index.html 200
```

- [ ] **Step 2: 创建 `client/public/_headers`**

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=300

/images/*
  Cache-Control: public, max-age=86400

/*
  X-Frame-Options: DENY
```

- [ ] **Step 3: 提交**

```bash
git add client/public/_redirects client/public/_headers
git commit -m "chore(static): Cloudflare Pages 路由回退与缓存头"
```

---

### Task 8: 全量验证与文档更新

**Files:**
- Modify: `AGENTS.md`
- Modify: `Docs/superpowers/plans/2026-08-14-static-site.md`（本文件，勾选完成项）

- [ ] **Step 1: 全量语法检查**

```bash
Get-ChildItem client/src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem client/scripts -Filter *.mjs | ForEach-Object { node --check $_.FullName }
```

预期：全部无输出（0 错误）。JSX 文件由本机构建验证。

- [ ] **Step 2: 数据脚本全流程验证**

```bash
cd client && node scripts/build-content.mjs && node -e "
const posts = require('./public/data/posts.json')
const notes = require('./public/data/notes.json')
const cats = require('./public/data/categories.json')
if (posts.length !== 1) throw new Error('posts 数量错误')
if (notes.length !== 1) throw new Error('notes 数量错误')
if (cats.length !== 1) throw new Error('categories 数量错误')
if (posts[0].tags.length !== 2) throw new Error('tags 数量错误')
console.log('data OK')
"
```

预期输出：`✔ posts: 1, notes: 1, categories: 1, tags: 2` 与 `data OK`

- [ ] **Step 3: 更新 `AGENTS.md`（静态化后的架构说明）**

将「Setup」「Server architecture」「Client notes」三节改写为：
- Setup：`cd client && npm install && npm run dev`（先构建数据再起 vite）；`npm run build` 后 `npx wrangler pages deploy client/dist` 部署
- 架构：内容在 `content/`（posts/notes/config.json/images），构建脚本 `client/scripts/build-content.mjs` 生成 `client/public/data/*.json`，前端 api 层读本地 JSON 前端过滤；无后端、无数据库
- 约定：文章文件名 `YYYY-MM-DD-slug.md`，frontmatter 可选

- [ ] **Step 4: 提交**

```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md 更新为纯静态架构说明"
```

- [ ] **Step 5: 收尾——验证提交历史与分支状态**

```bash
git log --oneline main..feature
git status --short
```

预期：feature 分支 8 个新提交，工作区干净（`client/public/data/` 等生成物已忽略）。

---

## 自审记录

**Spec 覆盖检查**：设计 §3 内容结构 → Task 1/2 ✓；§4 构建脚本 → Task 2 ✓；§5 数据层 → Task 4/5 ✓；§6 删除清单 → Task 6 ✓；§7 部署 → Task 3/7 ✓；§8 取舍 → 记录于 AGENTS.md ✓。

**遗留风险（实现时注意）**：
1. `App.jsx` 原文件包含 admin 路由与 lazy 导入，Task 6 Step 2 为整体替换，需与当前文件内容核对
2. `getAdjacentPosts` 在 Task 4 返回空对象、真实逻辑在 Task 5 的 PostDetailPage 内实现——两步必须同批次完成，避免中间态（两 Task 相邻执行）
3. 笔记分类若引用 posts 未用过的分类名，将不进入 categories.json（前端笔记筛选按 slug 匹配会失效）——当前设计接受（笔记分类可选且实验阶段），已在脚本注释说明
4. JSX 无法 `node --check`，Task 5/6 的 JSX 改动依赖本机构建验证；脚本与 api 层已全部可静态验证
5. **字段名对齐（自审修正）**：构建脚本输出 `publishedAt`/`updatedAt`/`coverImage`（与前端组件现有引用一致），不要输出 `date`/`cover`——早期计划版本曾用错误字段名，已修正；实施时如再遇组件引用的字段，以组件现有代码为准
