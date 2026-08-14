# 纯静态化改造设计（Cloudflare Pages）

日期：2026-08-14
分支：feature（实验分支）
状态：已批准

## 1. 背景与目标

当前博客为 React SPA + Express/Prisma/SQLite 后端。目标：在 feature 分支将其改造为**纯静态站点**（无任何后端运行时），部署到 Cloudflare Pages。

已确认的决策：
- 内容全部重写（不迁移 SQLite 数据，数据库仅作备份留存）
- 删除评论、登录、后台管理
- 写作方式：Markdown 文件 + 重新构建部署；**frontmatter 完全可选**，元数据自动推导（后续可做辅助工具生成 frontmatter）
- 不需要 Cloudflare Workers（纯 Pages 托管）
- 保留现有全部前端 UI：杂志风首页、文章详情（TOC/灯箱/阅读进度/收藏）、分类/标签、搜索、笔记、主题切换、粒子/雪特效

## 2. 架构总览

```
content/                    ← 内容源（唯一需要人工维护的部分）
├── config.json             ← 站点设置（原 settings 表）
├── posts/*.md              ← 文章
├── notes/*.md              ← 笔记
└── images/**               ← 文章图片

scripts/build-content.mjs   ← 构建脚本（node，位于 client/scripts/）
client/src/api/*.js         ← 改为读取本地 JSON + 前端过滤（保持返回形状兼容）
client/                    ← 现有 React SPA 原样保留（页面/组件/样式）
```

构建产物：`client/public/data/*.json`、`sitemap.xml`、`robots.txt`、`client/public/images/`（全部 gitignore）。

## 3. 内容结构

### 3.1 文章：`content/posts/<YYYY-MM-DD>-<slug>.md`

元数据自动推导规则（frontmatter 可选，解析用 gray-matter）：
- `slug` ← 文件名（去掉日期前缀）
- `date` ← 文件名日期前缀；缺省用文件 mtime
- `title` ← frontmatter.title || 正文第一个 `# H1` || 文件名
- `category` / `tags` / `cover` / `excerpt` / `jpChar`（杂志装饰字）← frontmatter 可选；缺省为未分类/无标签
- `content/posts/` 下所有文件一律发布（draft 概念移除）

### 3.2 笔记：`content/notes/*.md`

标题←文件名（去 .md）；内容即正文；分类可选（frontmatter）。

### 3.3 站点设置：`content/config.json`

字段对应原后台外观设置：`site_title`、`site_subtitle`、`banner_image`、`avatar_emoji`、`profile_name`、`profile_signature`、`profile_bio`、`social_links`。缺省字段有默认值（现有 UI 的 fallback 逻辑）。

### 3.4 图片

文章内图片路径写 `/images/xxx.jpg`，文件放 `content/images/`，构建时复制到 `client/public/images/`。

## 4. 构建脚本 `client/scripts/build-content.mjs`

`npm run build` = `node scripts/build-content.mjs && vite build`；`npm run dev` 同理前置构建数据。

职责：
1. 解析 `content/posts/*.md`、`content/notes/*.md`（gray-matter）→ 应用 §3.1 推导规则
2. 校验：slug 重复、引用的分类不存在 → 报错终止
3. 自动收集分类/标签表，注入 `_count.posts` 计数
4. 输出 `client/public/data/posts.json`（按日期降序）、`notes.json`、`categories.json`、`tags.json`、`settings.json`
5. 生成 `sitemap.xml`（文章/分类/标签/笔记 URL）、`robots.txt`
6. 复制 `content/images/**` → `client/public/images/`

posts.json 每篇文章字段：`{ slug, title, date, category, tags, cover, excerpt, jpChar, content, viewCount }`。

## 5. 前端数据层改造

### 5.1 通用机制

- 新增 `client/src/api/loader.js`：`loadJson(path)` 用 fetch 读取 `public/data/` 下 JSON 并以 promise 缓存（同路径只请求一次）
- 所有 api 模块**保持现有返回形状** `{ data: { data, pagination } }`，页面/组件零改动（`res.data.data`、`res.data.pagination.total` 照常工作）

### 5.2 各模块改造

| 模块 | 行为 |
|---|---|
| `api/posts.js` | `getPosts({page,limit,category,tag,search})` 前端过滤（category/tag 按 slug、search 匹配标题+正文、分页计算 totalPages）；`getPostBySlug(slug)`；相邻文章由 PostDetailPage 本地计算（全量列表按索引取前后篇）。删除管理函数 |
| `api/categories.js` | `getCategories()` / `getCategoryBySlug(slug)` 读 JSON |
| `api/tags.js` | `getTags()` 读 JSON |
| `api/note.js` | `getNotes(params)` / `getPublicNotes(params)` 前端分页。删除管理函数 |
| `api/settings.js` | `getSettings()` 读 settings.json |

删除：`api/auth.js`、`api/upload.js`、`api/comments.js`、`api/client.js`（axios 不再使用，依赖移除）。

### 5.3 行为对齐

- 排序：posts.json 构建时已按日期降序，前端保持
- 视图计数：`viewCount` 展示为 localStorage 本机累计打开次数（每次打开详情页 +1，key 按 slug）

## 6. 删除清单

**路由/页面**：`/login`、`/admin` 及全部子路由；`pages/admin/*`（9 文件）、`LoginPage.jsx`、`AdminLayout.jsx`、`CommentSection.jsx`、`ConfirmModal.jsx`、`AdminToast.jsx`
**样式**：`styles/admin.css`（main.jsx 同步移除导入）
**依赖**：移除 `axios`、`@blocknote/*`、`@mantine/*`、`@mantine/notifications`；新增 devDependency `gray-matter`
**配置**：`vite.config.js` 删除 `/api`、`/uploads` proxy；`.gitignore` 增加 `client/public/data/`、`client/public/images/`、`client/public/sitemap.xml`、`client/public/robots.txt`

保留：全部前台页面/组件/样式、`react-markdown` 渲染链、`react-helmet-async`、`gsap`、搜索（改前端过滤）、主题切换、收藏、TOC/灯箱/阅读进度。

## 7. 部署（Cloudflare Pages）

- `client/public/_redirects`：`/* /index.html 200`（SPA 路由回退）
- `client/public/_headers`：静态资源缓存（`/assets/*` 一年 immutable，`/data/*` 短缓存）
- 部署：`npx wrangler pages deploy client/dist`；或 GitHub 集成（build command `npm run build`，output dir `client/dist`）
- 域名沿用 flowyu.xyz 系列

## 8. 已知取舍（实验分支可接受）

- SEO 弱：SPA 形态，搜索引擎仅见空壳；后续可在本架构上增量加预渲染（不在本次范围）
- 无评论/登录/服务端统计；浏览量为本机估算
- 内容更新流程：改 md → `npm run build` → deploy
- 旧 SQLite 数据库文件保留在仓库外作备份，不回滚删除

## 9. 范围外（明确不做）

- Cloudflare Workers / D1 / KV
- 预渲染/SSG/SEO 增强
- 评论系统
- frontmatter 生成工具（用户后续单独规划）
- 多语言、PWA
