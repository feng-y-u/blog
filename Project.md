# Project.md — 个人博客系统设计文档

> **版本**：v1.0
> **创建日期**：2026-05-20
> **状态**：定稿

---

## 1. 项目概述

### 1.1 一句话描述
一个轻量级的个人博客系统，支持 Markdown 写作、笔记管理，提供沉浸式阅读体验。

### 1.2 目标
- 为个人博主提供一个简洁、专注于写作和阅读的平台
- 支持 Markdown 文章撰写与展示
- 提供笔记管理能力，作为知识库的补充
- 易于部署和维护，一个人就能搞定

### 1.3 核心价值
- **写作优先**：Markdown 原生支持，让作者专注于内容
- **轻量简约**：去掉不必要的复杂度，只做博客该做的事
- **易于部署**：SQLite + Node.js，一台小机器就能跑

---

## 2. 功能需求

### 2.1 博客核心功能（MVP）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 文章列表 | 首页展示文章列表，支持分页 | P0 |
| 文章详情 | Markdown 渲染展示，代码高亮 | P0 |
| 文章分类 | 按分类筛选文章 | P0 |
| 文章标签 | 多标签标注，按标签筛选 | P0 |
| 文章搜索 | 标题/内容关键词搜索 | P1 |
| Markdown 编辑 | 后台编辑器，支持实时预览 | P0 |
| 草稿/发布 | 文章状态管理，支持存草稿 | P0 |
| 评论系统 | 访客评论，管理员回复 | P1 |

### 2.2 笔记管理功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 笔记上传 | 支持上传 Markdown / 纯文本文件 | P1 |
| 笔记列表 | 按时间倒序展示笔记 | P1 |
| 笔记分类 | 简单分类管理 | P2 |
| 笔记导出 | 导出为 Markdown 文件 | P2 |

### 2.3 管理后台功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 登录/退出 | 管理员身份认证 | P0 |
| 文章管理 | 文章列表、编辑、删除 | P0 |
| 分类管理 | 新增、编辑、删除分类 | P0 |
| 标签管理 | 标签增删改 | P0 |
| 评论管理 | 审核、删除评论 | P1 |
| 笔记管理 | 笔记上传、删除 | P1 |

---

## 3. 技术栈选型

| 层 | 技术 | 选型理由 |
|----|------|---------|
| **前端框架** | React 18 + Vite | 生态成熟，组件化开发，Vite 开发体验极佳 |
| **样式** | TailwindCSS | 原子化 CSS，开发效率高，产物小 |
| **路由** | React Router v6 | React 生态标准路由方案 |
| **Markdown 渲染** | react-markdown + remark-highlight.js | 安全渲染 Markdown，支持代码高亮 |
| **富文本编辑** | Tiptap（备用编辑器） | 可选，若需富文本编辑兜底 |
| **后端框架** | Node.js + Express | 轻量、灵活，与前端 JS 统一语言 |
| **数据库** | SQLite（better-sqlite3） | 零配置，无需单独数据库服务，文件级备份 |
| **ORM** | Prisma（SQLite 适配） | 类型安全，自动迁移，开发体验好 |
| **认证** | JWT（jsonwebtoken + bcryptjs） | 无状态认证，适合个人博客场景 |
| **文件上传** | multer | Express 生态标准文件上传中间件 |
| **部署** | Docker Compose / PM2 | 二选一，Docker 更标准化，PM2 更轻量 |

### 核心决策说明

**为什么选 SQLite 而非 PostgreSQL/MySQL？**
- 个人博客没有高并发写需求
- SQLite 零运维，数据文件直接备份即可
- 一台低配 VPS 足以运行
- 省去数据库连接池、用户管理等开销

**为什么选 Prisma 而非直接写 SQL？**
- 类型安全的查询 API，减少手写 SQL 错误
- 自动迁移管理，方便迭代
- 如果将来需要迁移到 PostgreSQL，切换成本低

**为什么前后端分离而非 Next.js？**
- 前后端分离架构更清晰，调试方便
- 个人项目不需要 SSR 的 SEO 优势（个人博客主要靠分享）
- 后期可独立扩展前后端

---

## 4. 系统架构

### 4.1 整体架构

```
React SPA → REST API → Express + Prisma → SQLite
```

### 4.2 请求数据流

```
用户操作 → React Router → 组件 → API 调用 → Express 路由
  → 中间件(认证/日志/错误) → 控制器 → Prisma → SQLite
  → JSON 响应 → React 渲染 → DOM 更新
```

### 4.3 目录结构约定

```
e:\Blog\
├── server/                  # 后端
│   ├── src/
│   │   ├── routes/          # 路由定义
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件（auth, error, logger）
│   │   ├── utils/           # 工具函数
│   │   └── app.js           # Express 入口
│   ├── prisma/
│   │   └── schema.prisma    # 数据库模型定义
│   ├── uploads/             # 上传文件存储
│   └── package.json
├── client/                  # 前端
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── api/             # API 请求封装
│   │   ├── utils/           # 工具函数
│   │   └── App.jsx          # 应用入口
│   ├── index.html
│   └── package.json
├── docker-compose.yml       # Docker 部署（可选）
└── README.md
```

---

## 5. 数据库设计

### 5.1 表结构总览

```
users      1──N  posts
posts      1──N  comments
posts      1──N  post_tags  N──1  tags
posts      N──1  categories
notes      N──1  categories
```

### 5.2 各表定义

#### users（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 用户ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| email | TEXT | UNIQUE, NOT NULL | 邮箱 |
| password_hash | TEXT | NOT NULL | bcrypt 哈希密码 |
| display_name | TEXT | | 显示名称 |
| avatar | TEXT | | 头像 URL |
| bio | TEXT | | 个人简介 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

#### categories（分类）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 分类ID |
| name | TEXT | UNIQUE, NOT NULL | 分类名称 |
| slug | TEXT | UNIQUE, NOT NULL | URL 友好标识 |
| description | TEXT | | 分类描述 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### tags（标签）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 标签ID |
| name | TEXT | UNIQUE, NOT NULL | 标签名称 |
| slug | TEXT | UNIQUE, NOT NULL | URL 友好标识 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### posts（文章）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 文章ID |
| title | TEXT | NOT NULL | 标题 |
| slug | TEXT | UNIQUE, NOT NULL | URL 友好标识 |
| content | TEXT | NOT NULL | Markdown 正文 |
| excerpt | TEXT | | 摘要（自动截取或手动填写） |
| cover_image | TEXT | | 封面图 URL |
| status | TEXT | NOT NULL, DEFAULT 'draft' | draft / published / archived |
| category_id | INTEGER | FK → categories.id | 所属分类 |
| author_id | INTEGER | FK → users.id, NOT NULL | 作者 |
| view_count | INTEGER | DEFAULT 0 | 阅读数 |
| published_at | DATETIME | | 发布时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

> 索引：`slug`(UNIQUE), `status + published_at`(复合索引), `category_id`, `author_id`

#### post_tags（文章-标签关联）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| post_id | INTEGER | FK → posts.id, NOT NULL | 文章ID |
| tag_id | INTEGER | FK → tags.id, NOT NULL | 标签ID |

> 复合主键：(post_id, tag_id)

#### comments（评论）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 评论ID |
| post_id | INTEGER | FK → posts.id, NOT NULL | 所属文章 |
| parent_id | INTEGER | FK → comments.id, NULL | 父评论（支持楼中楼） |
| author_name | TEXT | NOT NULL | 访客昵称 |
| author_email | TEXT | | 访客邮箱 |
| content | TEXT | NOT NULL | 评论内容 |
| status | TEXT | DEFAULT 'pending' | pending / approved / rejected |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### notes（笔记）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK, AUTO INCREMENT | 笔记ID |
| title | TEXT | NOT NULL | 标题 |
| content | TEXT | NOT NULL | Markdown 内容 |
| category_id | INTEGER | FK → categories.id, NULL | 所属分类 |
| file_path | TEXT | | 源文件路径（上传文件时记录） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | | 更新时间 |

---

## 6. API 设计

### 6.1 文章接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/posts | 文章列表（支持分页、筛选） | 否 |
| GET | /api/posts/:slug | 文章详情 | 否 |
| POST | /api/posts | 创建文章 | 是 |
| PUT | /api/posts/:id | 更新文章 | 是 |
| DELETE | /api/posts/:id | 删除文章 | 是 |
| PATCH | /api/posts/:id/status | 更新文章状态（发布/归档） | 是 |

**GET /api/posts 查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码，默认 1 |
| limit | int | 每页条数，默认 10 |
| category | string | 分类 slug |
| tag | string | 标签 slug |
| status | string | 文章状态（管理员用） |
| search | string | 关键词搜索 |

**响应格式**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 6.2 分类接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/categories | 分类列表 | 否 |
| GET | /api/categories/:slug | 分类详情（含文章数） | 否 |
| POST | /api/categories | 创建分类 | 是 |
| PUT | /api/categories/:id | 更新分类 | 是 |
| DELETE | /api/categories/:id | 删除分类 | 是 |

### 6.3 标签接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/tags | 标签列表（含文章数） | 否 |
| POST | /api/tags | 创建标签 | 是 |
| DELETE | /api/tags/:id | 删除标签 | 是 |

### 6.4 评论接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/posts/:postId/comments | 文章评论列表 | 否 |
| POST | /api/posts/:postId/comments | 发表评论 | 否 |
| PUT | /api/comments/:id | 审核/编辑评论 | 是 |
| DELETE | /api/comments/:id | 删除评论 | 是 |

### 6.5 笔记接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/notes | 笔记列表 | 是 |
| GET | /api/notes/:id | 笔记详情 | 是 |
| POST | /api/notes | 创建/上传笔记 | 是 |
| PUT | /api/notes/:id | 更新笔记 | 是 |
| DELETE | /api/notes/:id | 删除笔记 | 是 |
| GET | /api/notes/:id/export | 导出笔记为 MD 文件 | 是 |

### 6.6 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录，返回 JWT | 否 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/auth/me | 获取当前用户信息 | 是 |

### 6.7 通用接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/upload | 上传图片/文件 | 是 |
| GET | /api/feed | RSS/Atom 订阅 | 否 |
| GET | /api/sitemap | 站点地图 | 否 |


## 7. 前端设计

### 7.1 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| / | 首页 | 文章列表 |
| /post/:slug | 文章详情 | Markdown 渲染 |
| /categories | 分类列表 | 所有分类 |
| /category/:slug | 分类文章 | 某分类下的文章 |
| /tags | 标签云 | 所有标签 |
| /tag/:slug | 标签文章 | 某标签下的文章 |
| /search | 搜索结果 | 搜索页面 |
| /admin | 后台管理 | 后台仪表盘 |
| /admin/posts | 文章管理 | 文章 CRUD |
| /admin/posts/new | 写文章 | Markdown 编辑器 |
| /admin/posts/:id/edit | 编辑文章 | Markdown 编辑器 |
| /admin/categories | 分类管理 | 分类 CRUD |
| /admin/tags | 标签管理 | 标签 CRUD |
| /admin/comments | 评论管理 | 评论审核 |
| /admin/notes | 笔记管理 | 笔记列表/上传 |
| /login | 登录页 | 管理员登录 |

### 7.2 核心组件树

```
App
├── Layout (Public)
│   ├── Header (导航、搜索)
│   ├── Main Content
│   │   ├── PostList          # 文章列表
│   │   ├── PostCard          # 文章卡片
│   │   ├── PostDetail        # 文章详情
│   │   │   ├── MarkdownRenderer  # Markdown 渲染
│   │   │   ├── CodeBlock         # 代码高亮
│   │   │   └── CommentSection    # 评论区
│   │   ├── CategoryList      # 分类列表
│   │   ├── TagCloud          # 标签云
│   │   └── SearchBar         # 搜索
│   └── Footer
│
├── Layout (Admin)
│   ├── AdminSidebar          # 侧边导航
│   └── Admin Content
│       ├── PostEditor        # Markdown 编辑器（含预览）
│       │   ├── EditorToolbar
│       │   ├── EditorPane (textarea / Tiptap)
│       │   └── PreviewPane (react-markdown)
│       ├── PostManager       # 文章管理表格
│       ├── CategoryManager   # 分类管理
│       ├── TagManager        # 标签管理
│       ├── CommentManager    # 评论管理
│       └── NoteManager       # 笔记管理
│
├── LoginPage
└── NotFoundPage (404)
```

### 7.3 核心交互说明

**Markdown 编辑器**（后台写文章）：
- 左侧编辑区（textarea with monospace font）
- 右侧实时预览区（react-markdown 渲染）
- 工具栏：标题、加粗、斜体、链接、图片、代码块
- 草稿自动保存（localStorage 兜底）

**文章阅读页**：
- Markdown 内容渲染
- 代码块高亮（highlight.js）
- TOC 目录导航（由 Markdown 标题自动生成）
- 文章信息：分类、标签、发布时间、阅读数
- 底部评论区

---

## 8. 部署方案

### 8.1 开发环境

```bash
# 启动后端
cd server
npm install
npx prisma migrate dev
npm run dev     # http://localhost:3001

# 启动前端
cd client
npm install
npm run dev     # http://localhost:5173
```

### 8.2 生产环境（PM2）

```bash
# 构建前端
cd client
npm run build   # 输出到 dist/

# 启动后端（Express 托管前端静态文件）
cd server
npm run build   # 编译 TypeScript（如果有）
pm2 start src/app.js --name blog

# 或使用 PM2 ecosystem
pm2 start ecosystem.config.js
```

### 8.3 生产环境（Docker Compose）

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./data:/app/data        # SQLite 持久化
      - ./uploads:/app/uploads  # 上传文件持久化
    environment:
      - NODE_ENV=production
      - JWT_SECRET=change-me
    restart: unless-stopped
```

### 8.4 反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-blog.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /path/to/uploads/;
        expires 30d;
    }
}
```

### 8.5 数据备份

由于使用 SQLite，备份极为简单：

```bash
# 定时备份脚本
cp data/blog.db data/backups/blog-$(date +%Y%m%d).db
```

---

## 9. 开发路线图

详见 [Task.md](Task.md) 按 Phase 1→2→3 的完整任务分解。

| Phase | 目标 | 时间估算 |
|-------|------|---------|
| Phase 1 | 基础博客：能写文章、能看文章 | ~20h |
| Phase 2 | 功能完善：评论、搜索、笔记、RSS | ~12h |
| Phase 3 | 体验优化：响应式、主题、性能 | ~10h |

---

## 10. 附录

### 10.1 关键依赖

**server/package.json**
```
express, cors, helmet, morgan
@prisma/client, prisma (dev)
jsonwebtoken, bcryptjs
multer
marked (备用)
```

**client/package.json**
```
react, react-dom
react-router-dom
react-markdown, remark-gfm
rehype-highlight
tailwindcss, postcss, autoprefixer (dev)
axios
```

### 10.2 JWT 认证流程

```
登录 → 服务端验证用户名密码 → 签发 JWT（含用户ID、用户名）
  → 前端存储到 localStorage → 每次请求带 Authorization: Bearer <token>
  → 服务端中间件验证 → 放行或拒绝
```

JWT Payload:
```json
{
  "sub": 1,
  "username": "admin",
  "iat": 1716163200,
  "exp": 1716249600
}
```

### 10.3 文章 Slug 生成规则

由标题自动生成，保留中文：
```
"我的第一篇博客文章" → "我的第一篇博客文章"
"Hello World"        → "hello-world"
"Vue vs React: 对比"  → "vue-vs-react-对比"
```

若 slug 已存在，追加数字后缀：`my-post`, `my-post-1`, `my-post-2`。
