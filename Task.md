# Task.md — 个人博客系统开发计划

> **基于**：Project.md v1.0
> **更新日期**：2026-05-20
> **状态**：待执行

---

## 开发总览

```
Phase 1 ───────────────────────────────────────────── 基础博客
  ├─ Task 1.1  项目初始化与基础搭建
  ├─ Task 1.2  数据库设计与迁移
  ├─ Task 1.3  认证系统
  ├─ Task 1.4  文章 CRUD API
  ├─ Task 1.5  分类与标签 API
  ├─ Task 1.6  前端框架搭建与路由
  ├─ Task 1.7  前端文章展示
  ├─ Task 1.8  管理后台前端
  └─ Task 1.9  Phase 1 集成测试

Phase 2 ───────────────────────────────────────────── 功能完善
  ├─ Task 2.1  评论系统
  ├─ Task 2.2  搜索功能
  ├─ Task 2.3  笔记管理模块
  ├─ Task 2.4  管理后台完善
  ├─ Task 2.5  RSS 订阅
  └─ Task 2.6  Phase 2 集成测试

Phase 3 ───────────────────────────────────────────── 体验优化
  ├─ Task 3.1  响应式与主题切换
  ├─ Task 3.2  阅读体验增强
  ├─ Task 3.3  图片上传与管理
  ├─ Task 3.4  SEO 优化
  └─ Task 3.5  性能优化
```

---

## Phase 1：基础博客（核心功能）

> **目标**：能写文章、能看文章。MVP 可运行状态。

### Task 1.1 项目初始化与基础搭建

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | 无 |
| 预估工时 | 2h |
| 产出 | 可启动的前后端项目骨架 |

**子任务**：
1. 创建 `server/` 目录，初始化 Node.js 项目
2. 安装 Express 核心依赖：`express`, `cors`, `helmet`, `morgan`
3. 创建 Express 入口 `src/app.js`，配置基础中间件
4. 创建 `client/` 目录，`npm create vite@latest` 初始化 React 项目
5. 安装 TailwindCSS，配置 `tailwind.config.js`
6. 清理 Vite 模板默认文件，建立基础目录结构
7. 配置前端代理（Vite proxy → `localhost:3001`），解决跨域
8. 验证：前端 `npm run dev` + 后端 `npm run dev` 双双启动无报错

**目录结构**：
```
server/
├── src/
│   ├── app.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── utils/
├── prisma/
└── package.json

client/
├── src/
│   ├── App.jsx
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── utils/
├── index.html
└── package.json
```

---

### Task 1.2 数据库设计与迁移

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.1 |
| 预估工时 | 2h |
| 产出 | Prisma 模型 + 数据库迁移 + seed 脚本 |

**子任务**：
1. 安装 Prisma：`npm install @prisma/client` + `npm install -D prisma`
2. `npx prisma init` 初始化，配置 SQLite 数据源
3. 按 Project.md §5.3 编写 Prisma Schema
   - User, Post, Category, Tag, PostTag, Comment, Note
4. 执行 `npx prisma migrate dev --name init` 生成迁移文件
5. 创建 `prisma/seed.js`，写入初始数据（admin 用户、示例分类/标签）
6. 创建 `src/utils/prisma.js` 导出 PrismaClient 单例
7. 验证：`npx prisma studio` 可查看表结构

---

### Task 1.3 认证系统

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.2 |
| 预估工时 | 2h |
| 产出 | JWT 登录/验证中间件 |

**子任务**：
1. 安装依赖：`jsonwebtoken`, `bcryptjs`
2. 创建 `src/controllers/auth-controller.js`
   - `login`: 验证用户名密码，签发 JWT
   - `getMe`: 根据 Token 返回当前用户信息
3. 创建 `src/middleware/auth.js`
   - 验证 `Authorization: Bearer <token>` 头
   - 将用户信息挂载到 `req.user`
4. 创建 `src/routes/auth.js`，挂载到 `/api/auth`
5. 服务端启动时执行 seed，确保 admin 用户存在
6. 验证：`POST /api/auth/login` 返回 JWT；无 Token 访问受保护路由返回 401

**JWT 配置**：
```
JWT_SECRET: 环境变量 / .env 文件
JWT_EXPIRES_IN: "7d"  （个人博客，减少重复登录）
```

---

### Task 1.4 文章 CRUD API

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.2, Task 1.3 |
| 预估工时 | 3h |
| 产出 | Posts 完整 API |

**子任务**：
1. 创建 `src/controllers/post-controller.js`
2. 实现接口（按顺序）：
   - `GET /api/posts` — 公开，支持分页(page/limit)、筛选(category/tag/status/search)
   - `GET /api/posts/:slug` — 公开，文章详情（含分类、标签）
   - `POST /api/posts` — 需认证，创建文章（含标签关联）
   - `PUT /api/posts/:id` — 需认证，更新文章
   - `DELETE /api/posts/:id` — 需认证，删除文章
   - `PATCH /api/posts/:id/status` — 需认证，更新状态
3. 创建 Slug 工具函数 `src/utils/slugify.js`
   - 保留中文字符，英文转小写，空格转连字符
   - 冲突时追加数字后缀
4. 创建 `src/routes/posts.js`，挂载到 `/api/posts`
5. 验证：使用 Postman / curl 测试所有接口

**响应格式**：
```json
{
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

---

### Task 1.5 分类与标签 API

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.2, Task 1.3 |
| 预估工时 | 1.5h |
| 产出 | 分类 + 标签完整 API |

**子任务**：
1. 创建 `src/controllers/category-controller.js`
   - `GET /api/categories` — 公开，返回列表（含文章数）
   - `GET /api/categories/:slug` — 公开，分类详情
   - `POST /api/categories` — 需认证
   - `PUT /api/categories/:id` — 需认证
   - `DELETE /api/categories/:id` — 需认证（级联处理）
2. 创建 `src/controllers/tag-controller.js`
   - `GET /api/tags` — 公开，返回列表（含文章数）
   - `POST /api/tags` — 需认证
   - `PUT /api/tags/:id` — 需认证
   - `DELETE /api/tags/:id` — 需认证（级联处理）
3. 创建对应路由文件，挂载到 `/api/categories` 和 `/api/tags`
4. 验证：使用 curl 测试所有接口

---

### Task 1.6 前端框架搭建与路由

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.1 |
| 预估工时 | 2h |
| 产出 | 前端路由 + 公共布局 |

**子任务**：
1. 安装依赖：`react-router-dom`, `axios`
2. 创建 `src/api/client.js` — axios 实例封装（baseURL + 拦截器自动带 Token）
3. 配置 React Router v6 路由（按 Project.md §7.1 路由表）
4. 创建公共布局组件 `src/components/Layout.jsx`（Header + Footer）
5. 创建管理后台布局 `src/components/AdminLayout.jsx`（Sidebar + 内容区）
6. 各页面创建占位组件，验证路由跳转正常
7. 配置 Vite proxy：`/api` → `http://localhost:3001`

**路由结构**：
```jsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/post/:slug" element={<PostDetailPage />} />
      <Route path="/categories" element={<CategoryListPage />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/tags" element={<TagCloudPage />} />
      <Route path="/tag/:slug" element={<TagPage />} />
      <Route path="/search" element={<SearchPage />} />
    </Route>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="posts" element={<PostManager />} />
      <Route path="posts/new" element={<PostEditor />} />
      <Route path="posts/:id/edit" element={<PostEditor />} />
      <Route path="categories" element={<CategoryManager />} />
      <Route path="tags" element={<TagManager />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
</BrowserRouter>
```

---

### Task 1.7 前端文章展示

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.4, Task 1.5, Task 1.6 |
| 预估工时 | 3h |
| 产出 | 首页 + 文章详情 + 分类/标签页 |

**子任务**：
1. 安装 `react-markdown`, `remark-gfm`, `rehype-highlight`
2. 创建文章相关 API 封装 `src/api/posts.js`
3. 实现 **首页** `HomePage.jsx`
   - 文章列表（PostCard 组件）
   - 分页组件
   - 侧边栏：分类列表、标签云
4. 实现 **文章详情页** `PostDetailPage.jsx`
   - MarkdownRenderer 组件（react-markdown + 代码高亮）
   - 文章元信息：分类、标签、发布时间、阅读数
   - TOC 目录导航（由 Markdown 标题自动生成）
5. 实现 **分类页** `CategoryListPage.jsx` + `CategoryPage.jsx`
6. 实现 **标签云** `TagCloudPage.jsx` + `TagPage.jsx`
7. 统一加载状态（Loading Spinner）和空状态展示

---

### Task 1.8 管理后台前端

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.3, Task 1.6, Task 1.7 |
| 预估工时 | 4h |
| 产出 | 管理后台所有页面 |

**子任务**：
1. 实现 **登录页** `LoginPage.jsx`
   - 表单：用户名 + 密码
   - 登录成功后 JWT 存入 localStorage，跳转后台
   - 路由守卫：未登录访问 /admin 时重定向到 /login
2. 实现 **文章管理** `PostManager.jsx`
   - 表格展示所有文章（标题、分类、状态、发布时间）
   - 每行操作：编辑、删除、切换状态
3. 实现 **Markdown 编辑器** `PostEditor.jsx`
   - 左侧编辑区（textarea），右侧实时预览
   - 工具栏：加粗、斜体、标题、链接、图片、代码块
   - 表单：标题、分类选择、标签输入、封面图 URL
   - 按钮：保存草稿 / 发布
   - 草稿自动保存到 localStorage
   - 编辑已有文章时回填数据
4. 实现 **分类管理** `CategoryManager.jsx` — 表格 + 新增/编辑弹窗
5. 实现 **标签管理** `TagManager.jsx` — 表格 + 新增/编辑弹窗
6. 后台仪表盘 `AdminDashboard.jsx` — 数据概览（文章数、评论数等）
7. 验证：完整的"写文章 → 发布 → 前台可见"流程

---

### Task 1.9 Phase 1 集成测试

| 字段 | 内容 |
|------|------|
| 优先级 | P0 |
| 依赖 | Task 1.1 ~ 1.8 |
| 预估工时 | 2h |
| 产出 | 可运行的 MVP |

**验证清单**：
- [ ] 前后端均可正常启动
- [ ] 注册/登录流程正常，JWT 有效
- [ ] 创建分类、标签 → 可见
- [ ] 写文章（Markdown）→ 保存草稿 → 发布
- [ ] 前台首页能展示已发布的文章
- [ ] 点击文章进入详情页，Markdown 渲染正常，代码高亮正常
- [ ] 按分类、标签筛选文章正常
- [ ] 编辑、删除文章正常
- [ ] 修改文章状态（发布/归档）正常

---

## Phase 2：功能完善

> **目标**：完成评论、搜索、笔记功能，完善管理后台。

### Task 2.1 评论系统

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Phase 1 |
| 预估工时 | 3h |

**子任务**：
1. **后端**：
   - 创建 `comment-controller.js` — 列表、创建、审核、删除
   - 创建 `routes/comments.js`
2. **前端**：
   - 文章详情页底部集成评论区 `CommentSection.jsx`
   - 评论表单（昵称、邮箱、内容）
   - 评论列表展示，支持楼中楼回复
   - 管理后台评论管理（审核/驳回/删除）
3. 验证：提交评论 → 后台审核 → 前台可见

---

### Task 2.2 搜索功能

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Phase 1 |
| 预估工时 | 2h |

**子任务**：
1. **后端**：文章接口已支持 `search` 参数，用 Prisma 的 `contains` 做模糊匹配
2. **前端**：
   - Header 搜索框，输入时防抖
   - 搜索结果页 `SearchPage.jsx`，展示匹配文章列表
   - 高亮搜索关键词
3. 验证：搜索关键词能正确匹配标题和内容

---

### Task 2.3 笔记管理模块

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Phase 1 |
| 预估工时 | 3h |

**子任务**：
1. **后端**：
   - 创建 `note-controller.js` — CRUD + 文件上传 + 导出 MD
   - 创建 `routes/notes.js`
   - multer 配置：接收 Markdown 文件上传
2. **前端**：
   - 管理后台笔记列表页 `NoteManager.jsx`
   - 笔记上传（拖拽或选择文件）
   - 笔记在线编辑
   - 笔记导出按钮
3. 验证：上传 .md 文件 → 内容入库 → 在线编辑 → 导出

---

### Task 2.4 管理后台完善

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Task 2.1, Task 2.3 |
| 预估工时 | 1.5h |

**子任务**：
1. 评论管理页面集成到后台侧边栏导航
2. 笔记管理页面集成到后台侧边栏导航
3. 数据统计仪表盘完善（图表或数字卡片）
4. 管理后台响应式适配

---

### Task 2.5 RSS 订阅

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Phase 1 |
| 预估工时 | 1h |

**子任务**：
1. 安装 `rss` 或 `feed` npm 包
2. 创建 `GET /api/feed`，生成 RSS 2.0 / Atom XML
3. 在页面 `<head>` 中添加 RSS link tag
4. 验证：浏览器访问 `/api/feed` 返回合法 XML

---

### Task 2.6 Phase 2 集成测试

| 字段 | 内容 |
|------|------|
| 优先级 | P1 |
| 依赖 | Task 2.1 ~ 2.5 |
| 预估工时 | 1.5h |

**验证清单**：
- [ ] 评论发布 → 审核 → 展示全流程
- [ ] 搜索能命中文档内容
- [ ] 笔记上传、编辑、导出正常
- [ ] 管理后台所有菜单可用
- [ ] RSS 订阅 XML 格式正确
- [ ] 数据统计仪表盘显示正常

---

## Phase 3：体验优化

> **目标**：打磨细节，提升阅读和写作体验。

### Task 3.1 响应式与主题切换

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 依赖 | Phase 1 |
| 预估工时 | 3h |

**子任务**：
1. TailwindCSS 响应式断点适配移动端（`sm:`, `md:`, `lg:`）
2. 暗色模式：`class` 策略 + Tailwind `dark:` variant
3. 主题切换按钮（Header 右上角）
4. 主题偏好持久化到 localStorage
5. 适配所有页面（首页、文章详情、后台等）

---

### Task 3.2 阅读体验增强

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 依赖 | Phase 1 |
| 预估工时 | 2h |

**子任务**：
1. 文章详情页增加阅读进度条（顶部固定）
2. 侧边 TOC 目录导航（跟随滚动高亮当前标题）
3. 字体大小切换按钮
4. 文章底部：上一篇/下一篇导航
5. 文章阅读数实时更新

---

### Task 3.3 图片上传与管理

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 依赖 | Phase 1 |
| 预估工时 | 2h |

**子任务**：
1. 后端：multer 配置图片上传（格式校验 + 大小限制）
2. 后端：`POST /api/upload` 返回图片 URL
3. 前端：Markdown 编辑器插入图片（上传或粘贴 URL）
4. 前端：图片预览（lightbox 效果）
5. 上传目录按日期归档：`uploads/2026/05/`

---

### Task 3.4 SEO 优化

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 依赖 | Phase 1 |
| 预估工时 | 1.5h |

**子任务**：
1. 动态生成页面 `<title>` 和 `<meta>` 描述
2. 生成 `robots.txt`
3. 生成 `sitemap.xml`（`GET /api/sitemap`）
4. 图片添加 `alt` 属性
5. 语义化 HTML 标签（`<article>`, `<nav>`, `<aside>`）

---

### Task 3.5 性能优化

| 字段 | 内容 |
|------|------|
| 优先级 | P2 |
| 依赖 | Phase 1 |
| 预估工时 | 2h |

**子任务**：
1. 前端代码分割（React.lazy + Suspense 按路由拆分）
2. 图片懒加载（`loading="lazy"`）
3. 文章列表无限滚动或虚拟滚动（如文章数 > 50）
4. 后端添加响应缓存头（`Cache-Control`）
5. 打包分析 + 优化（`rollup-plugin-visualizer`）

---

## 附录：开发规范

详见 [coding.md](coding.md)。
- Git 分支策略 → coding.md §6.1
- 提交信息格式 → coding.md §6.2
- 代码风格与命名约定 → coding.md §1.2
