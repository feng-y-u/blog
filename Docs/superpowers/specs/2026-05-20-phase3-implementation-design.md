# Phase 3 实现方案设计

> 基于：Project.md v1.0, Task.md v1.0
> 日期：2026-05-20
> 状态：定稿

---

## 1. 推进方式

严格按 Task.md Phase 3 的编号顺序推进：3.1 → 3.2 → 3.3 → 3.4 → 3.5。
每个 Task 完成后验证再进入下一个。

**依赖关系：**

```
3.1 主题系统与 Banner ───────── 3.2 阅读体验增强（共享文章详情页）
                                    │
3.3 图片上传与管理 ────────────────┤（编辑器增强）
                                    │
3.4 SEO 优化 ─── 独立，可随时插入    │
                                    │
3.5 性能优化 ─── 独立，可随时插入    │
                                    ↓
                              3.6 集成测试
```

3.1 是基础，必须先完成（CSS 变量体系、Banner、侧边栏）。3.2~3.5 相对独立。

---

## 2. 关键决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| CSS 方案 | CSS 自定义属性 + TailwindCSS 混合 | 原型大量使用 CSS 变量实现渐变/发光/阴影，纯 Tailwind 无法完全复现 |
| 主题切换 | `data-theme` 属性 + CSS 变量 + JS 切换 | 与原型一致，切换只需改一个属性值 |
| Banner 背景 | 管理后台可上传自定义图片 | 用户不希望写死在 CSS 中 |
| 图片上传 | multer 按日期归档 + 格式/大小校验 | 复用已有 multer 依赖 |
| Lightbox | 纯 CSS + React state，无额外依赖 | 功能简单，无需引入库 |
| SEO | react-helmet-async（~5KB） | 轻量，React 生态标准方案 |
| 代码分割 | React.lazy + Suspense 按路由拆分 | Vite 原生支持，零配置 |
| 字体切换 | CSS 变量 `--article-font-size` | 简单可控，无额外依赖 |

---

## 3. 前端视觉方案

### 3.1 设计参考

- [Docs/前端设计/anime-blog-prototype.html](Docs/前端设计/anime-blog-prototype.html) — 首页布局、Banner、侧边栏、文章卡片
- [Docs/前端设计/article-detail.html](Docs/前端设计/article-detail.html) — 文章详情、TOC、评论区、上下篇导航

### 3.2 Phase 3 视觉范围

| 元素 | 实现方式 | 来源 |
|------|---------|------|
| CSS 变量主题系统 | `theme.css` 定义完整变量集 | 原型 :root |
| 暗色/亮色切换 | data-theme + localStorage | 原型 JS |
| Banner（可上传背景） | 管理后台上传，默认使用渐变+城市剪影 | 原型 + 用户定制 |
| 侧边栏资料卡 | 头像、签名、社交链接 | 原型 |
| 导航统计卡片 | 文章/笔记/项目数 | 原型 |
| 标签云（尺寸分级） | tag/tag-lg/tag-sm | 原型 |
| 阅读进度条 | fixed top, scroll 驱动 | 原型 |
| TOC 目录（跟随高亮） | IntersectionObserver | 原型 |
| 代码块语言标签 | lang-tag 右上角 | 原型 |
| 上下篇导航 | 双卡片布局 | 原型 |
| 文章操作按钮 | 复制链接/收藏/举报 | 原型 |
| 入场动画 | fadeInUp | 原型 |
| 字体大小切换 | CSS 变量 | Task.md |
| 阅读数递增 | view_count++ | Task.md |

### 3.3 CSS 变量体系

在 `client/src/styles/theme.css` 中定义，TailwindCSS `tailwind.config.js` 引用这些变量：

```css
:root[data-theme="dark"] {
  --bg: #0d0d14;
  --surface: #16161f;
  --card: #1a1a26;
  --card-hover: #1f1f2e;
  --border: #2a2a3a;
  --fg: #e4e4ed;
  --fg-secondary: #8888a0;
  --fg-muted: #5c5c70;
  --accent: #00d4ff;
  --accent-dim: rgba(0, 212, 255, 0.12);
  --accent-glow: rgba(0, 212, 255, 0.08);
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
  --banner-h: 280px;
  --sidebar-w: 300px;
  --article-font-size: 16px;
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:root[data-theme="light"] {
  --bg: #f0f0f5;
  --surface: #ffffff;
  --card: #ffffff;
  --card-hover: #f8f8fc;
  --border: #e0e0ea;
  --fg: #1a1a2e;
  --fg-secondary: #6b6b80;
  --fg-muted: #9999aa;
  --accent: #0088cc;
  --accent-dim: rgba(0, 136, 204, 0.1);
  --accent-glow: rgba(0, 136, 204, 0.06);
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.08);
}
```

TailwindCSS 配置引用变量：

```js
// tailwind.config.js
colors: {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  card: 'var(--card)',
  border: 'var(--border)',
  fg: 'var(--fg)',
  'fg-secondary': 'var(--fg-secondary)',
  accent: 'var(--accent)',
}
```

**迁移策略：** 现有 `dark:` 前缀样式逐步替换为 CSS 变量引用，保持向后兼容。

---

## 4. Task 执行路径

### Task 3.1 主题系统与 Banner

#### 4.1.1 CSS 变量体系搭建

新建 `client/src/styles/theme.css`，包含完整变量集（见 §3.3）。
在 `client/src/main.jsx` 中导入此 CSS 文件。

**主题切换：**

```javascript
// 初始化：读取 localStorage，设置 data-theme
const saved = localStorage.getItem('blog-theme')
if (saved) document.documentElement.setAttribute('data-theme', saved)
else document.documentElement.setAttribute('data-theme', 'dark')

// 切换函数
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme')
  const next = cur === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('blog-theme', next)
}
```

**主题切换按钮：**
- 固定在 Header 右上角，圆形按钮（44x44px）
- 背景 `var(--surface)`，边框 `var(--border)`
- 图标：暗色模式 🌙，亮色模式 ☀️
- 参考原型 §78-101

#### 4.1.2 Banner 组件

新建 `client/src/components/Banner.jsx`：

```
Banner
├── .banner-container（position: relative, overflow: hidden）
│   ├── <img>（用户上传的背景图，有则显示）
│   ├── .banner-gradient（默认渐变背景，无图时显示）
│   │   ├── 星星效果（radial-gradient 多点分布）
│   │   └── 城市剪影（SVG mask）
│   ├── .banner-moon（月球装饰）
│   ├── .banner-title（站点标题）
│   └── .banner-subtitle（站点副标题）
```

**Banner 图片上传：**
- 在管理后台「外观设置」页面上传
- 图片存入 `uploads/banner/`
- URL 存入数据库或配置文件
- Banner 加载时先检查是否有自定义图片，有则显示图片 + 半透明遮罩

**布局效果：**
- Banner 与内容区重叠效果：`margin-top: -40px`（参考原型 §212）
- 内容区 `z-index: 3` 在 Banner 之上
- Banner 底部渐变过渡到内容区

#### 4.1.3 侧边栏组件

新建 `client/src/components/Sidebar.jsx`，包含三个卡片：

**资料卡：**
- 头像（圆形，渐变边框，emoji 或图片）
- 昵称（`--font-display`，22px）
- 签名（斜体，accent 色）
- 简介（次要色，13px）
- 社交链接（图标按钮 row）

**导航统计：**
- 三列网格：文章数 / 笔记数 / 项目数
- 数字 `--font-display` 22px 加粗
- 可点击跳转到对应页面

**标签云：**
- 从 API 获取标签列表
- 按文章数分三级尺寸：tag-lg / tag / tag-sm
- 胶囊按钮样式

#### 4.1.4 响应式适配

TailwindCSS 断点策略（覆盖所有页面）：

| 断点 | 布局 | 侧边栏 |
|------|------|--------|
| `lg:1024px+` | 两栏（侧边栏 + 主内容） | 固定显示，sticky |
| `md:768-1023px` | 单栏 | 顶部汉堡菜单展开 |
| `sm:640px-767px` | 单栏 | 汉堡菜单 |
| `<640px` | 单栏，缩小内边距 | 汉堡菜单 |

#### 4.1.5 入场动画

在 `theme.css` 中定义 fadeInUp 关键帧：

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

应用到文章卡片、文章详情、评论区等元素，通过 `nth-child` 递延出现。

#### 4.1.6 自定义滚动条

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
```

---

### Task 3.2 阅读体验增强

#### 4.2.1 阅读进度条

在 `PostDetailPage.jsx` 中新增进度条组件：

```jsx
function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <div id="progress-bar" className="fixed top-0 left-0 h-[3px] z-[9999] transition-[width] duration-100"
      style={{
        width: `${Math.min(progress, 100)}%`,
        background: 'linear-gradient(90deg, var(--accent), #00f5ff)',
        boxShadow: '0 0 12px var(--accent-glow)',
      }} />
  )
}
```

参考原型 §66-76。

#### 4.2.2 TOC 目录导航

在 `PostDetailPage.jsx` 中实现 TOC，从 Markdown 内容提取标题：

```javascript
function extractTOC(content) {
  const regex = /^(#{2,3})\s+(.+)$/gm
  const headings = []
  let match
  while ((match = regex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '')
    })
  }
  return headings
}
```

**跟随高亮：** 使用 `IntersectionObserver` 监听各标题元素，当前可见的标题高亮。

参考原型 §384-428（TOC 样式）+ §1163-1172（平滑滚动 JS）。

#### 4.2.3 字体大小切换

```jsx
const [fontSize, setFontSize] = useState(localStorage.getItem('article-font') || 'medium')
const fontSizes = { small: '15px', medium: '16px', large: '19px' }

// 应用：document.documentElement.style.setProperty('--article-font-size', fontSizes[fontSize])
// 文章 body 使用 var(--article-font-size)
```

切换按钮放在文章标题区域或进度条旁，三个尺寸图标。

#### 4.2.4 上下篇导航

**后端新增：** `GET /api/posts/:id/adjacent`

```javascript
async function getAdjacentPosts(req, res) {
  const id = +req.params.id
  const [prev, next] = await Promise.all([
    prisma.post.findFirst({ where: { id: { lt: id }, status: 'published' }, orderBy: { id: 'desc' }, select: { id: true, title: true, slug: true } }),
    prisma.post.findFirst({ where: { id: { gt: id }, status: 'published' }, orderBy: { id: 'asc' }, select: { id: true, title: true, slug: true } }),
  ])
  res.json({ data: { prev, next } })
}
```

**前端渲染：** 参考原型 §594-628 `article-nav` 样式，评论区上方双卡片布局。

#### 4.2.5 阅读数递增

在后端 `post-controller.js` 的 `getBySlug` 中启用阅读数递增：

```javascript
await prisma.post.update({ where: { id: post.id }, data: { view_count: { increment: 1 } } })
```

#### 4.2.6 代码块语言标签

创建自定义 rehype 插件或修改 MarkdownRenderer 组件，在 `<pre>` 内的代码块右上角显示语言名称（参考原型 §485-491）。

从 `className="language-xxx"` 中提取语言名，渲染为 `<span class="lang-tag">JavaScript</span>`。

#### 4.2.7 文章操作按钮

在文章底部标签下方，三个按钮（参考原型 §569-591）：
- 🔗 复制链接：`navigator.clipboard.writeText(url)`
- ☆ 收藏：localStorage 存储收藏列表
- ⚠ 举报：暂做 UI 占位

---

### Task 3.3 图片上传与管理

#### 4.3.1 后端图片上传

**multer 配置：** `server/src/middleware/upload.js`

```javascript
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dateDir = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const dir = path.join(__dirname, '../../uploads', dateDir)
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
})
```

**API：**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/upload | 上传图片，返回 URL | 是 |
| GET | /uploads/* | 静态文件托管 | 否 |

#### 4.3.2 前端编辑器集成

在 `PostEditor.jsx` 工具栏新增图片按钮：
- 点击弹出两种模式：上传文件 / 粘贴 URL
- 上传文件：`FormData` → `POST /api/upload` → 获取 URL → 插入 `![](url)`
- 粘贴 URL：直接插入 Markdown 图片语法
- 上传中显示 loading 状态

#### 4.3.3 Lightbox 预览

新建 `client/src/components/Lightbox.jsx`：

```jsx
export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <img src={src} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} />
    </div>
  )
}
```

在 `PostDetailPage.jsx` 中给文章图片添加点击事件，打开 Lightbox。

---

### Task 3.4 SEO 优化

#### 4.4.1 动态 Meta 标签

安装 `react-helmet-async`：

```bash
cd client && npm install react-helmet-async
```

在 `App.jsx` 外层包裹 `<HelmetProvider>`。

创建 `client/src/utils/seo.js` 或直接在页面组件中使用：

```jsx
import { Helmet } from 'react-helmet-async'

// HomePage
<Helmet>
  <title>Yuki's Blog — 代码与动漫的世界</title>
  <meta name="description" content="个人博客，分享编程技术和动漫文化" />
</Helmet>

// PostDetailPage
<Helmet>
  <title>{post.title} — Blog</title>
  <meta name="description" content={post.excerpt || post.title} />
</Helmet>

// CategoryPage / TagPage
<Helmet>
  <title>{name} — Blog</title>
</Helmet>

// 404
<Helmet><title>页面未找到 — Blog</title></Helmet>
```

#### 4.4.2 Sitemap

后端新增 `GET /api/sitemap`：

```javascript
async function sitemap(req, res) {
  const siteUrl = req.protocol + '://' + req.get('host')
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
  })
  // 生成 XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  xml += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`
  xml += `  <url><loc>${siteUrl}/categories</loc><priority>0.8</priority></url>\n`
  xml += `  <url><loc>${siteUrl}/tags</loc><priority>0.8</priority></url>\n`
  posts.forEach(p => {
    xml += `  <url><loc>${siteUrl}/post/${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><priority>0.9</priority></url>\n`
  })
  xml += '</urlset>'
  res.set('Content-Type', 'application/xml; charset=utf-8')
  res.send(xml)
}
```

#### 4.4.3 Robots.txt

后端新增 `GET /robots.txt`：

```text
User-agent: *
Allow: /
Sitemap: https://your-blog.com/api/sitemap
```

#### 4.4.4 语义化 HTML

审核现有组件，确保使用语义标签：
- `<article>` — 文章卡片、文章详情
- `<nav>` — 导航、分页、上下篇
- `<aside>` — 侧边栏
- `<main>` — 主要内容区
- `<header>` / `<footer>` — 页眉/页脚
- 所有 `<img>` 添加 `alt` 属性

---

### Task 3.5 性能优化

#### 4.5.1 代码分割

将管理后台和文章详情页改为懒加载：

```jsx
// App.jsx
import { lazy, Suspense } from 'react'

const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const PostManager = lazy(() => import('./pages/admin/PostManager'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor'))
// ... 其他管理后台页面

// 包裹 Suspense
<Route path="/post/:slug" element={
  <Suspense fallback={<Loading />}><PostDetailPage /></Suspense>
} />
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Suspense fallback={<Loading />}><AdminDashboard /></Suspense>} />
  {/* ... */}
</Route>
```

#### 4.5.2 图片懒加载

```jsx
// 文章内容中的图片
<img src={url} alt={alt} loading="lazy" />

// 文章列表封面图
<img src={post.coverImage} alt={post.title} loading="lazy" />
```

#### 4.5.3 后端缓存

```javascript
// 公开 API 添加缓存头
res.set('Cache-Control', 'public, max-age=300')

// RSS feed 缓存更长时间
res.set('Cache-Control', 'public, max-age=3600')
```

适用于：文章列表、分类列表、标签列表、RSS feed。

---

## 5. API 变更

### 新增接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/upload | 上传图片 | 是 |
| GET | /api/posts/:id/adjacent | 上下篇文章 | 否 |
| GET | /api/sitemap | 站点地图 | 否 |
| GET | /robots.txt | 爬虫规则 | 否 |
| POST | /api/banner | 上传 Banner 背景图 | 是 |
| GET | /api/banner | 获取 Banner 配置 | 否 |

### 修改接口

| 路径 | 改动 |
|------|------|
| GET /api/posts/:slug | 增加 `view_count` 递增逻辑 |
| GET /api/posts | 添加 `Cache-Control` 响应头 |
| GET /api/categories | 添加 `Cache-Control` 响应头 |
| GET /api/tags | 添加 `Cache-Control` 响应头 |
| GET /api/feed | 添加 `Cache-Control` 响应头 |

---

## 6. 新增文件清单

### 后端

| 文件 | 用途 |
|------|------|
| server/src/middleware/upload.js | multer 图片上传配置 |
| server/src/controllers/upload-controller.js | 图片上传控制器 |
| server/src/controllers/sitemap-controller.js | sitemap + robots.txt |
| server/src/controllers/banner-controller.js | Banner 配置 CRUD |

### 前端

| 文件 | 用途 |
|------|------|
| client/src/styles/theme.css | CSS 变量主题系统 |
| client/src/components/Banner.jsx | Banner 组件 |
| client/src/components/Sidebar.jsx | 侧边栏组件 |
| client/src/components/ReadingProgress.jsx | 阅读进度条 |
| client/src/components/TOC.jsx | 目录导航 |
| client/src/components/Lightbox.jsx | 图片预览 |
| client/src/components/ThemeToggle.jsx | 主题切换按钮 |
| client/src/pages/admin/AppearanceSettings.jsx | 外观设置（Banner上传等） |

---

## 7. 修改文件清单

### 后端

| 文件 | 改动 |
|------|------|
| server/src/app.js | 新增 upload/banner/sitemap/robots 路由 |
| server/src/controllers/post-controller.js | 新增 getAdjacentPosts，getBySlug 增加 view_count 递增 |
| server/src/routes/posts.js | 新增 adjacent 路由 |

### 前端

| 文件 | 改动 |
|------|------|
| client/src/main.jsx | 导入 theme.css |
| client/src/App.jsx | 导入 Sidebar、Banner，添加 React.lazy 代码分割 |
| client/src/components/Layout.jsx | 集成 Banner、Sidebar、ThemeToggle |
| client/src/pages/PostDetailPage.jsx | 集成 ReadingProgress、TOC、Lightbox、字体切换、上下篇导航、阅读数 |
| client/src/pages/admin/PostEditor.jsx | 工具栏增加图片上传按钮 |
| client/src/pages/admin/AdminLayout.jsx | 侧边栏增加「外观设置」菜单 |
| client/src/index.css | 移除或迁移现有暗色模式变量 |
| tailwind.config.js | 颜色配置引用 CSS 变量 |

---

## 8. 依赖变更

```bash
cd client && npm install react-helmet-async
```

---

## 9. 验证清单

**3.1 主题系统与 Banner：**
- [ ] 暗色/亮色模式切换正常，偏好持久化
- [ ] Banner 展示正常，默认显示渐变+城市剪影
- [ ] 管理后台可上传 Banner 图片，前台立即生效
- [ ] 侧边栏资料卡、统计、标签云展示正常
- [ ] 响应式：手机/平板/桌面三档布局正常
- [ ] 入场动画流畅

**3.2 阅读体验增强：**
- [ ] 阅读进度条随滚动平滑变化
- [ ] TOC 自动提取文章标题，点击平滑滚动
- [ ] TOC 跟随滚动高亮当前标题
- [ ] 字体切换生效，偏好持久化
- [ ] 上下篇导航显示正确，点击跳转正常
- [ ] 阅读数在每次访问时递增
- [ ] 代码块右上角显示语言标签
- [ ] 文章操作按钮功能正常

**3.3 图片上传与管理：**
- [ ] 仅接受 jpg/png/gif/webp，超 5MB 拒绝
- [ ] 上传后正确返回 URL
- [ ] 编辑器工具栏可插入图片
- [ ] 文章内点击图片弹出 Lightbox
- [ ] ESC 或点击遮罩关闭 Lightbox

**3.4 SEO 优化：**
- [ ] 各页面 `<title>` 和 `<meta>` 动态生成
- [ ] `GET /api/sitemap` 返回合法 XML
- [ ] `GET /robots.txt` 返回正确内容
- [ ] 语义化 HTML 标签使用正确

**3.5 性能优化：**
- [ ] 管理后台页面懒加载，首屏 JS 体积减小
- [ ] 图片 loading="lazy" 生效
- [ ] 公开 API 返回 Cache-Control 头
