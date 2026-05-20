# Phase 2 实现方案设计

> 基于：Project.md v1.0, Task.md v1.0
> 日期：2026-05-20
> 状态：定稿

---

## 1. 推进方式

严格按 Task.md Phase 2 的编号顺序推进：2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6。
每个 Task 完成后验证再进入下一个。

**依赖关系：**

```
2.1 评论系统 ───────────────── 2.4 管理后台完善
                                    │
2.3 笔记管理 ───────────────────────┘
                                    │
2.5 RSS 订阅 ── 独立，可随时插入    │
                                    │
2.2 搜索增强 ── 已有后端支持 ───────┘
                                    ↓
                              2.6 集成测试
```

Task 2.4（管理后台完善）需等待 2.1 和 2.3 的后端 API 就绪后再做前端集成。

---

## 2. 关键决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 视觉风格 | 采用原型设计风格，主题切换和 Banner 动画延到 Phase 3 | 不阻塞功能交付 |
| CSS 方案 | TailwindCSS 为主，扩展自定义 CSS 实现渐变/动效 | 保持 Phase 1 一致性 |
| 评论匿名制 | 访客只需昵称 + 邮箱，无需注册 | 降低评论门槛 |
| 评论审核 | 默认 pending，管理员批准后可见 | 防垃圾评论 |
| 笔记上传 | multer 接收 .md 文件，解析内容入库 | 复用已有依赖 |
| 搜索增强 | 后端已有 search 参数，前端做防抖 + 分类筛选 + 关键词高亮 | 后端已就绪 |
| RSS | 使用 `feed` npm 包生成标准 RSS 2.0 | 轻量无额外依赖 |
| Markdown 渲染 | 复用 Phase 1 的 react-markdown + rehype-highlight | 保持统一 |

---

## 3. 前端视觉方案

### 3.1 设计参考

- [Docs/前端设计/anime-blog-prototype.html](Docs/前端设计/anime-blog-prototype.html) — 首页与列表布局
- [Docs/前端设计/article-detail.html](Docs/前端设计/article-detail.html) — 文章详情与评论区

### 3.2 Phase 2 视觉范围

| 元素 | Phase 2 实现 | 延后到 Phase 3 |
|------|-------------|----------------|
| 侧边栏资料卡（头像、签名、社交链接） | ✅ | |
| 导航统计卡片（文章数/笔记数/项目数） | ✅ | |
| 标签云样式（尺寸分级、胶囊按钮） | ✅ | |
| 文章卡片（带分类标签、封面图区域、阅读全文） | ✅ | |
| 搜索框 + 分类筛选按钮行 | ✅ | |
| 分页组件样式 | ✅ | |
| 文章详情 TOC 目录 | ✅ | |
| 评论区样式（头像、表单、列表） | ✅ | |
| 代码块语言标签 | ✅ | |
| 文章上下篇导航 | ✅ | |
| Banner（月球、星空、城市剪影） | | ✅ |
| 主题切换按钮（暗色/亮色） | | ✅ |
| 阅读进度条 | | ✅ |
| 页面入场动画 | | ✅ |
| CSS 自定义属性主题系统 | | ✅ |

### 3.3 样式实现方式

在 `client/src/styles/` 下新增 `phase2.css`，用 TailwindCSS `@apply` 封装原型中的常用样式模式：

```css
/* 示例 */
.sidebar-card {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
         rounded-xl p-6 shadow-sm;
}
.tag {
  @apply inline-block px-3 py-1 text-xs rounded-full 
         bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
         border border-gray-200 dark:border-gray-600 
         hover:border-blue-400 hover:text-blue-600 transition-colors;
}
.tag-lg { @apply text-sm px-4 py-1.5; }
.tag-sm { @apply text-xs px-2 py-0.5; }
```

避免引入完整的 CSS Variables 体系，在 Phase 2 中保持 TailwindCSS 的 `dark:` 前缀方案不变。

---

## 4. Task 执行路径

### Task 2.1 评论系统

#### 4.1.1 后端 API

在 `src/controllers/comment-controller.js` 中实现：

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/posts/:postId/comments | 文章评论列表（仅 approved） | 否 |
| POST | /api/posts/:postId/comments | 发表评论 | 否 |
| GET | /api/comments | 所有评论列表（管理员用，含 pending） | 是 |
| PUT | /api/comments/:id | 审核/编辑评论 | 是 |
| DELETE | /api/comments/:id | 删除评论 | 是 |

**控制器函数：**

```javascript
// comment-controller.js
async function listByPost(req, res)    // GET /api/posts/:postId/comments
async function create(req, res)        // POST /api/posts/:postId/comments
async function listAll(req, res)       // GET /api/comments (admin)
async function update(req, res)        // PUT /api/comments/:id (审核)
async function remove(req, res)        // DELETE /api/comments/:id
```

**详情：**

- `listByPost`：返回指定文章的已批准评论（`status: 'approved'`），按时间正序，包含楼中楼回复（`include: { replies: true }`）
- `create`：校验 `authorName` 和 `content` 必填，`postId` 取自 URL 参数，验证文章存在，`status` 默认为 `pending`。支持 `parentId` 参数实现楼中楼回复
- `listAll`：管理员查看所有评论（含 pending/rejected），支持分页
- `update`：管理员审核评论，可修改 `status`（approved/rejected）和 `content`
- `remove`：删除评论（级联删除回复）

**路由：** `src/routes/comments.js`

```javascript
router.get('/posts/:postId/comments', controller.listByPost)
router.post('/posts/:postId/comments', controller.create)
router.get('/comments', auth, controller.listAll)
router.put('/comments/:id', auth, controller.update)
router.delete('/comments/:id', auth, controller.remove)
```

挂载到 `app.js`：两条路由拆开挂，评论列表和创建挂到 post 路由，管理接口单独挂。

#### 4.1.2 前端评论区

**组件：** `client/src/components/CommentSection.jsx`

参考原型 `article-detail.html` §630-741 实现：

```
CommentSection
├── .comments-title          "评论（N 条）"
├── CommentForm              textarea + 发表按钮
│   ├── textarea             placeholder + 自动调整高度
│   ├── authorNameInput      访客昵称输入
│   └── authorEmailInput     访客邮箱输入（可选）
├── CommentList
│   └── CommentItem × N
│       ├── .comment-avatar  默认头像（根据昵称生成）
│       ├── .comment-author  昵称 + 日期
│       ├── .comment-text    评论内容
│       └── .comment-reply   回复按钮
│           └── CommentForm  嵌套回复表单
```

**状态与数据流：**

```javascript
// CommentSection 内部状态
const [comments, setComments] = useState([])
const [loading, setLoading] = useState(true)

// 评论提交流程：
// 表单提交 → POST /api/posts/:postId/comments
//   → 后端返回 201 → 追加到 comments 列表顶部（待审核状态）
//   → 或后端返回错误 → 显示错误提示

// 楼中楼回复：
// 点击"回复" → 展开嵌套 CommentForm（设置 parentId）
//   → 提交时带 parentId → 后端关联父评论
```

#### 4.1.3 前端评论管理

在 `AdminLayout` 侧边栏新增「评论管理」入口，对应页面 `client/src/pages/admin/CommentManager.jsx`：

- 表格展示所有评论（文章标题、作者、内容摘要、状态、时间）
- 每行操作：批准、驳回、删除
- 状态筛选：全部 / 待审核 / 已批准 / 已驳回

---

### Task 2.2 搜索功能增强

#### 4.2.1 现状

- 后端 `GET /api/posts` 已支持 `search` 查询参数（`title` 和 `content` 的 `contains` 模糊匹配）
- 前端 `SearchPage.jsx` 已有基本表单 + 结果展示，但无防抖、无分类筛选、无关键词高亮

#### 4.2.2 前端增强

参考原型 `anime-blog-prototype.html` §392-449 改造 `SearchPage.jsx`：

**搜索框区域：**
- 放大镜图标 + input（参考原型 `.search-bar` 样式）
- 分类筛选按钮行（全部 / 技术 / 动漫 / 教程 / 开源，从 API 动态获取分类列表）
- 输入防抖：`useEffect` + `setTimeout` 300ms，避免每次按键都发请求

**搜索结果：**
- 使用 `PostCard` 组件展示结果
- 关键词高亮：用一个简单的高亮函数包裹匹配文本，`<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{match}</mark>`
- 空状态：显示"没有找到匹配的文章"（参考原型 `.no-results`）

**搜索参数同步：**
- 使用 `useSearchParams` 保持搜索词在 URL 中，支持分享搜索结果页
- `?q=关键词` → 自动触发搜索

---

### Task 2.3 笔记管理模块

#### 4.3.1 后端 API

在 `src/controllers/note-controller.js` 中实现：

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/notes | 笔记列表（支持分页、分类筛选） | 是 |
| GET | /api/notes/:id | 笔记详情 | 是 |
| POST | /api/notes | 创建笔记（JSON 或文件上传） | 是 |
| PUT | /api/notes/:id | 更新笔记 | 是 |
| DELETE | /api/notes/:id | 删除笔记 | 是 |
| GET | /api/notes/:id/export | 导出笔记为 .md 文件 | 是 |

**控制器函数：**

```javascript
async function list(req, res)      // GET /api/notes
async function getById(req, res)   // GET /api/notes/:id
async function create(req, res)    // POST /api/notes（JSON body 或 multipart/form-data）
async function update(req, res)    // PUT /api/notes/:id
async function remove(req, res)    // DELETE /api/notes/:id
async function exportNote(req, res) // GET /api/notes/:id/export
```

**详情：**

- `create`：支持两种方式——
  - JSON body：`{ title, content, categoryId }`
  - 文件上传：multer 接收 `.md` 文件，解析文件名作为 title，文件内容作为 content
- `exportNote`：设置 `Content-Disposition: attachment; filename="xxx.md"`，返回笔记的 Markdown 内容
- `list`：支持 `page`, `limit`, `categoryId` 参数，按 `updatedAt` 倒序
- multer 配置：仅接受 `.md` 文件，大小限制 1MB

**路由：** `src/routes/notes.js`

```javascript
const multer = require('multer')
const upload = multer({ dest: 'uploads/notes/', limits: { fileSize: 1024 * 1024 } })

router.get('/', auth, controller.list)
router.get('/:id', auth, controller.getById)
router.post('/', auth, upload.single('file'), controller.create)
router.put('/:id', auth, controller.update)
router.delete('/:id', auth, controller.remove)
router.get('/:id/export', auth, controller.exportNote)
```

#### 4.3.2 前端笔记管理

**页面：** `client/src/pages/admin/NoteManager.jsx`

布局参考管理后台其他页面风格：

- **笔记列表**：表格或卡片列表，展示标题、分类、更新时间
- **上传笔记**：文件选择器（accept `.md`）+ 拖拽上传区域
- **在线编辑**：点击笔记 → 展开编辑器（同 PostEditor 的 textarea 模式）
- **导出按钮**：每行右侧导出图标，点击下载 .md 文件

**新增 API 封装：** `client/src/api/notes.js`

```javascript
export const getNotes = params => client.get('/notes', { params })
export const getNote = id => client.get(`/notes/${id}`)
export const createNote = data => client.post('/notes', data)
export const updateNote = (id, data) => client.put(`/notes/${id}`, data)
export const deleteNote = id => client.delete(`/notes/${id}`)
export const exportNote = id => client.get(`/notes/${id}/export`, { responseType: 'blob' })
```

---

### Task 2.4 管理后台完善

在 Task 2.1 和 2.3 完成后端 API 后，更新管理后台：

#### 4.4.1 侧边栏导航更新

`AdminLayout.jsx` 新增菜单项：

```
仪表盘
文章管理
写文章
分类管理
标签管理
评论管理      ← 新增
笔记管理      ← 新增
```

#### 4.4.2 仪表盘数据完善

如果 `AdminDashboard.jsx` 还有未完成的数据指标，此时补全：
- 文章总数（已发布/草稿/归档）
- 评论总数（待审核/已批准）
- 笔记总数
- 最近评论列表（小部件）

#### 4.4.3 路由更新

`App.jsx` 新增路由：

```jsx
<Route path="comments" element={<CommentManager />} />
<Route path="notes" element={<NoteManager />} />
```

---

### Task 2.5 RSS 订阅

#### 4.5.1 后端实现

安装 `feed` 包：

```bash
cd server && npm install feed
```

创建 `src/controllers/feed-controller.js`：

```javascript
const { Feed } = require('feed')
const prisma = require('../utils/prisma')

async function rss(req, res) {
  const siteUrl = req.protocol + '://' + req.get('host')
  
  const feed = new Feed({
    title: "Yuki's Blog",
    description: '代码与动漫的世界',
    id: siteUrl,
    link: siteUrl,
    language: 'zh-CN',
    updated: new Date(),
  })

  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    include: { category: true, author: true },
  })

  posts.forEach(post => {
    feed.addItem({
      title: post.title,
      id: `${siteUrl}/post/${post.slug}`,
      link: `${siteUrl}/post/${post.slug}`,
      description: post.excerpt || '',
      content: post.content,
      author: [{ name: post.author.displayName }],
      category: post.category ? [{ name: post.category.name }] : [],
      date: post.publishedAt || post.createdAt,
    })
  })

  res.set('Content-Type', 'application/rss+xml; charset=utf-8')
  res.send(feed.rss2())
}
```

**路由：** 在 `app.js` 中注册 `GET /api/feed`。

---

### Task 2.6 Phase 2 集成测试

#### 验证清单

**评论系统：**
- [ ] 访客在文章详情页看到评论区
- [ ] 提交评论（含昵称、邮箱、内容）→ 提示成功
- [ ] 评论默认不显示在前台（pending 状态）
- [ ] 管理员在后台看到待审核评论 → 批准 → 前台可见
- [ ] 楼中楼回复功能正常
- [ ] 管理员可删除评论

**搜索功能：**
- [ ] 搜索框输入 → 300ms 防抖后自动搜索
- [ ] 搜索结果正确匹配标题和内容
- [ ] 关键词在结果中高亮显示
- [ ] 分类筛选按钮可切换
- [ ] 空搜索结果展示空状态
- [ ] URL 参数 `?q=关键词` 可分享

**笔记管理：**
- [ ] 管理后台可上传 .md 文件
- [ ] 上传后内容正确解析入库
- [ ] JSON 方式创建笔记正常
- [ ] 笔记列表展示正常
- [ ] 在线编辑笔记 → 保存成功
- [ ] 导出笔记 → 下载 .md 文件

**管理后台完善：**
- [ ] 侧边栏"评论管理"、"笔记管理"菜单正常跳转
- [ ] 仪表盘显示文章/评论/笔记统计数据

**RSS 订阅：**
- [ ] `GET /api/feed` 返回合法 RSS XML
- [ ] 包含最近 20 篇已发布文章
- [ ] RSS 阅读器可正常解析

---

## 5. 新增文件清单

### 后端

| 文件 | 用途 |
|------|------|
| server/src/controllers/comment-controller.js | 评论 CRUD |
| server/src/routes/comments.js | 评论路由 |
| server/src/controllers/note-controller.js | 笔记 CRUD + 导出 |
| server/src/routes/notes.js | 笔记路由 |
| server/src/controllers/feed-controller.js | RSS feed 生成 |

### 前端

| 文件 | 用途 |
|------|------|
| client/src/components/CommentSection.jsx | 评论区组件 |
| client/src/pages/admin/CommentManager.jsx | 评论管理页 |
| client/src/pages/admin/NoteManager.jsx | 笔记管理页 |
| client/src/api/notes.js | 笔记 API 封装 |
| client/src/styles/phase2.css | 原型样式封装 |

### 依赖

```bash
cd server && npm install feed
```

---

## 6. 修改文件清单

### 后端

| 文件 | 改动 |
|------|------|
| server/src/app.js | 注册评论路由、笔记路由、feed 路由 |

### 前端

| 文件 | 改动 |
|------|------|
| client/src/App.jsx | 新增评论管理、笔记管理路由 |
| client/src/components/AdminLayout.jsx | 侧边栏新增评论、笔记菜单项 |
| client/src/pages/SearchPage.jsx | 防抖、分类筛选、关键词高亮 |
| client/src/pages/PostDetailPage.jsx | 集成 CommentSection 组件 |
| client/src/pages/admin/AdminDashboard.jsx | 补全评论/笔记统计 |
