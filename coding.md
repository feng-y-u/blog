# Coding.md — 个人博客系统编码规范

> **基于技术栈**：React 18 + Vite + TailwindCSS / Node.js + Express / Prisma + SQLite
> **版本**：v1.0

---

## 1. 通用原则

### 1.1 核心准则

1. **简洁优先** — 用最少的代码解决问题。不写冗余的空行、注释、日志。
2. **命名即文档** — 变量、函数、组件命名要自解释，不依赖注释说明。
3. **避免抽象** — 不到第三次出现相同的模式，不要提取公共抽象。
4. **不做超前设计** — 只解决当前需求，不为"未来可能"预留扩展点。
5. **一致性** — 同类型的事物用同一种方式表达。

### 1.2 命名约定总览

| 类别 | 规范 | 示例 |
|------|------|------|
| 文件名（后端） | kebab-case | `post-controller.js`, `auth-routes.js` |
| 文件名（前端组件） | PascalCase | `PostCard.jsx`, `PostEditor.jsx` |
| 文件名（前端非组件） | camelCase | `apiClient.js`, `usePosts.js` |
| 变量/函数 | camelCase | `getPosts()`, `viewCount` |
| 类/组件 | PascalCase | `class ApiError extends Error` |
| 常量 | UPPER_SNAKE_CASE | `JWT_SECRET`, `MAX_FILE_SIZE` |
| 数据库字段 | snake_case | `created_at`, `author_id` |
| API 路径 | kebab-case, 复数 | `/api/posts`, `/api/categories` |
| 路由参数 | camelCase | `:postId`, `:slug` |

### 1.3 文件最大长度

- **后端文件**：≤ 200 行（超出则拆分 controller 或提取 service）
- **前端组件**：≤ 250 行（超出则拆分子组件）
- **路由文件**：≤ 50 行（路由定义应极简，只做挂载）

---

## 2. 项目结构规范

### 2.1 目录结构

```
server/
├── prisma/
│   └── schema.prisma       # 数据库模型
├── src/
│   ├── app.js              # Express 入口（中间件注册 + 路由挂载）
│   ├── routes/             # 路由定义（薄层，仅做 URL→Controller 映射）
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── categories.js
│   │   ├── tags.js
│   │   ├── comments.js
│   │   └── notes.js
│   ├── controllers/        # 控制器（处理请求参数 → 调用 service → 返回响应）
│   │   ├── auth-controller.js
│   │   ├── post-controller.js
│   │   ├── category-controller.js
│   │   ├── tag-controller.js
│   │   ├── comment-controller.js
│   │   └── note-controller.js
│   ├── middleware/          # Express 中间件
│   │   ├── auth.js         # JWT 验证
│   │   ├── error.js        # 全局错误处理
│   │   └── validate.js     # 请求参数校验
│   ├── utils/              # 工具函数
│   │   ├── prisma.js       # PrismaClient 单例
│   │   ├── slugify.js      # Slug 生成
│   │   └── jwt.js          # JWT 签发/验证
│   └── config/             # 配置
│       └── index.js        # 环境变量读取
└── package.json

client/
├── src/
│   ├── main.jsx            # 应用入口
│   ├── App.jsx             # 路由配置
│   ├── pages/              # 页面级组件（对应路由）
│   │   ├── HomePage.jsx
│   │   ├── PostDetailPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── admin/
│   │       ├── PostEditor.jsx
│   │       ├── PostManager.jsx
│   │       └── ...
│   ├── components/         # 通用组件
│   │   ├── Layout.jsx      # 前台布局
│   │   ├── AdminLayout.jsx # 后台布局
│   │   ├── PostCard.jsx
│   │   ├── MarkdownRenderer.jsx
│   │   └── ...
│   ├── hooks/              # 自定义 Hooks
│   │   ├── usePosts.js
│   │   ├── useAuth.js
│   │   └── useCategories.js
│   ├── api/                # API 请求封装
│   │   ├── client.js       # axios 实例
│   │   ├── posts.js
│   │   ├── auth.js
│   │   ├── categories.js
│   │   └── tags.js
│   ├── store/              # 状态管理（Context 或简单 store）
│   │   └── auth-context.jsx
│   ├── utils/              # 前端工具函数
│   │   ├── format-date.js
│   │   └── storage.js      # localStorage 封装
│   └── styles/             # 全局样式
│       └── index.css       # Tailwind 指令
├── index.html
└── package.json
```

### 2.2 分层职责

**后端三层架构**：

```
Route → Controller → Prisma → SQLite
```

| 层 | 职责 | 不允许做的事 |
|----|------|-------------|
| **Route** | 定义 HTTP 方法和路径，调用 Controller | 写业务逻辑、直接访问数据库 |
| **Controller** | 解析参数，调用 Prisma，返回响应 | 直接操作 req/res 之外的东西 |
| **Middleware** | 预处理请求（认证、校验、日志） | 修改业务数据 |

---

## 3. 后端编码规范

### 3.1 Express 路由

路由文件应极薄，只做 URL→Controller 的映射：

```js
// ✅ 正确 — routes/posts.js
const router = require('express').Router()
const controller = require('../controllers/post-controller')
const auth = require('../middleware/auth')

router.get('/', controller.list)
router.get('/:slug', controller.getBySlug)
router.post('/', auth, controller.create)
router.put('/:id', auth, controller.update)
router.delete('/:id', auth, controller.remove)
router.patch('/:id/status', auth, controller.updateStatus)

module.exports = router
```

```js
// ❌ 错误 — 路由里写业务逻辑
router.post('/', auth, async (req, res) => {
  const { title, content } = req.body
  const slug = slugify(title)
  // ... 几十行业务代码
})
```

### 3.2 Controller 模式

Controller 函数签名统一为 `(req, res, next)`：

```js
// ✅ 正确 — controllers/post-controller.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function list(req, res, next) {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query
    const where = { status: 'published' }

    if (category) where.category = { slug: category }
    if (tag) where.tags = { some: { tag: { slug: tag } } }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true, tags: { include: { tag: true } } },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ])

    res.json({
      data,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    next(err)
  }
}
```

**Controller 规范**：
- 每个 Controller 函数只做一件事
- 使用 `try/catch + next(err)` 统一错误处理，不要自己 `res.status(500).json(...)`
- 数据格式转换（如日期格式化）放在前端处理，后端返回原始数据

### 3.3 错误处理

全局错误中间件放在路由注册之后：

```js
// ✅ 正确 — middleware/error.js
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message)

  if (err.code === 'P2025') {
    return res.status(404).json({ error: '资源不存在' })
  }

  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  })
}

module.exports = errorHandler
```

```js
// app.js 注册顺序
app.use('/api', routes)
app.use(errorHandler) // 最后注册
```

### 3.4 API 响应格式

```js
// 成功 - 单条数据
{ "data": { ... } }

// 成功 - 列表
{ "data": [ ... ], "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }

// 错误
{ "error": "描述信息" }
```

### 3.5 环境变量

通过 `src/config/index.js` 统一读取：

```js
// ✅ 正确 — config/index.js
require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: 5 * 1024 * 1024, // 5MB
}
```

---

## 4. 前端编码规范

### 4.1 组件结构

每个组件文件遵循统一结构：

```jsx
// ✅ 正确 — components/PostCard.jsx
import { Link } from 'react-router-dom'

// Props 解构，不写 defaultProps
export default function PostCard({ title, slug, excerpt, category, publishedAt }) {
  return (
    <article className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <Link to={`/post/${slug}`}>
        <h2 className="text-xl font-semibold">{title}</h2>
      </Link>
      {category && (
        <span className="text-sm text-gray-500">{category.name}</span>
      )}
      {excerpt && <p className="mt-2 text-gray-600">{excerpt}</p>}
      <time className="text-sm text-gray-400">{publishedAt}</time>
    </article>
  )
}
```

**组件规范**：
- 每个文件只导出一个组件（默认导出）
- Props 在函数签名中解构，不要用 `prop-types` 或 TypeScript
- 使用函数组件 + hooks，不使用 class 组件
- 复杂组件提取子组件到同一目录的 `_sub/` 文件夹

### 4.2 Hooks 规范

```jsx
// ✅ 正确 — hooks/usePosts.js
import { useState, useEffect } from 'react'
import { getPosts } from '../api/posts'

export function usePosts(params) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    setLoading(true)
    getPosts(params)
      .then(res => {
        setData(res.data.data)
        setPagination(res.data.pagination)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [JSON.stringify(params)])

  return { data, loading, error, pagination }
}
```

**Hooks 规范**：
- Hook 文件名以 `use` 开头（`usePosts.js`）
- 每个 Hook 只封装一个关注点
- API 调用放在 `api/` 目录，Hook 不直接调用 axios

### 4.3 API 层

```jsx
// ✅ 正确 — api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 自动携带 Token
client.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 统一错误处理
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
```

```jsx
// ✅ 正确 — api/posts.js
import client from './client'

export const getPosts = params => client.get('/posts', { params })
export const getPostBySlug = slug => client.get(`/posts/${slug}`)
export const createPost = data => client.post('/posts', data)
export const updatePost = (id, data) => client.put(`/posts/${id}`, data)
export const deletePost = id => client.delete(`/posts/${id}`)
export const updatePostStatus = (id, status) => client.patch(`/posts/${id}/status`, { status })
```

### 4.4 TailwindCSS 规范

```jsx
// ✅ 正确 — 原子化类优先
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  发布
</button>

// ⚠️ 避免 — 过度使用 @apply
// 只在组件复用度极高时使用 @apply 提取
```

- **优先使用原子类**，不主动创建自定义 CSS
- 组件级别的复用使用组件组合而非 CSS class 提取
- 全局样式只放在 `styles/index.css`（Tailwind 指令 + 极少量全局样式）

```css
/* ✅ 正确 — styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4.5 Markdown 渲染

```jsx
// ✅ 正确 — components/MarkdownRenderer.jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default function MarkdownRenderer({ content }) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

---

## 5. 数据库规范（Prisma）

### 5.1 Schema 规范

```prisma
// ✅ 正确 — 字段顺序：ID → 业务字段 → 时间戳
model Post {
  id          Int       @id @default(autoincrement())
  title       String
  slug        String    @unique
  content     String
  status      String    @default("draft")
  categoryId  Int?      @map("category_id")
  category    Category? @relation(fields: [categoryId], references: [id])
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([status])
  @@map("posts")
}
```

**Schema 规范**：
- 使用 `@map` 将字段映射为 `snake_case`（SQLite 习惯）
- 使用 `@@map` 将表名映射为 `snake_case` 复数
- 字段顺序：id → 外键 → 业务字段 → 状态 → 时间戳
- 必须的索引显式声明 `@@index`
- 不使用 `@unique` 以外的数据库级约束

### 5.2 Prisma 查询规范

```js
// ✅ 正确 — 只查需要的字段
const posts = await prisma.post.findMany({
  select: { id: true, title: true, slug: true, excerpt: true },
  where: { status: 'published' },
  orderBy: { publishedAt: 'desc' },
})

// ❌ 避免 — 无 select 全字段查询（除非真需要全部字段）
const posts = await prisma.post.findMany()
```

### 5.3 迁移规范

- 每次 Schema 变更使用 `npx prisma migrate dev` 生成迁移
- 迁移文件提交到 git
- 不手动修改已生成的迁移文件

---

## 6. Git 规范

### 6.1 分支策略

```
main        ← 稳定版本，只从 develop merge
develop     ← 开发主线
feat/*      ← 功能分支，如 feat/post-api
fix/*       ← 修复分支，如 fix/auth-token
```

### 6.2 提交信息格式

```
<type>(<scope>): <description>

类型: feat | fix | refactor | chore | docs | style
范围: 修改的模块名（如 post, auth, editor）
描述: 中文，动词开头，不超过 20 字
```

示例：
```
feat(post): 添加文章 CRUD API
fix(auth): 修复 Token 过期后无法刷新
refactor(editor): 提取 PreviewPane 组件
chore(deps): 更新 prisma 到 5.x
```

### 6.3 提交规范

- 一个提交只做一件事
- 不提交未完成的功能（除非在 feat 分支）
- 不提交调试代码（console.log、debugger）
- 不提交 .env 文件

---

## 7. 代码审查清单

审查 PR 时逐项检查：

### 功能性
- [ ] 功能是否按预期工作
- [ ] 是否处理了边界情况（空列表、不存在、重复）
- [ ] 错误路径是否被正确处理

### 代码质量
- [ ] 命名是否自解释
- [ ] 是否有死代码（注释掉的代码、未使用的变量）
- [ ] 是否有多余的 console.log / debugger
- [ ] 函数是否只做一件事
- [ ] 组件是否足够小

### 安全
- [ ] API 路由是否正确设置了认证中间件
- [ ] 用户输入是否有校验
- [ ] JWT 是否安全存储

### 性能
- [ ] 数据库查询是否加了必要的索引
- [ ] 列表查询是否有分页
- [ ] 前端是否处理了 loading 状态
