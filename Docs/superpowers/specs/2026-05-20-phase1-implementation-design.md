# Phase 1 实现方案设计

> 基于：Project.md v1.0, Task.md v1.0, coding.md v1.0
> 日期：2026-05-20
> 状态：定稿

---

## 1. 推进方式

严格按 Task.md Phase 1 的编号顺序推进：1.1 → 1.2 → 1.3 → ... → 1.9。
每个 Task 完成后验证再进入下一个。

## 2. 关键决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 样式方案 | TailwindCSS 纯方案（dark: variant） | 与 coding.md 一致，避免两套 CSS 体系 |
| 前端视觉阶段 | Phase 1 只做核心布局，Phase 3 做视觉增强 | 先保证功能可用，再打磨视觉效果 |
| Markdown 渲染 | react-markdown + rehype-highlight | 安全渲染，代码高亮 |
| 状态管理 | React Context（auth-context） | 个人博客状态简单，不需要 Redux |
| 草稿存储 | localStorage 自动保存 | 防止意外丢失，本地持久化 |
| 错误处理 | 全局 error middleware | 统一错误格式，避免 controller 重复 try/catch |
| 分页格式 | `{ data, pagination }` | 统一 API 响应规范 |

## 3. Task 执行路径

### Task 1.1 项目初始化与基础搭建
- 后端：Express + cors + helmet + morgan，端口 3001
- 前端：Vite + React 18 + TailwindCSS + react-router-dom + axios
- Vite proxy: `/api` → `http://localhost:3001`
- 目录结构按 coding.md §2.1 创建

### Task 1.2 数据库设计与迁移
- Prisma + SQLite
- 7 个模型：User, Post, Category, Tag, PostTag, Comment, Note
- 字段映射：`@map` snake_case，`@@map` snake_case 复数表名
- Seed 脚本：admin 用户 + 示例分类/标签

### Task 1.3 认证系统
- JWT（jsonwebtoken + bcryptjs），7 天过期
- 接口：`POST /api/auth/login`，`GET /api/auth/me`
- Auth 中间件验证 `Authorization: Bearer <token>`

### Task 1.4 文章 CRUD API
- 公开：`GET /api/posts`（分页/筛选）、`GET /api/posts/:slug`
- 认证：`POST`、`PUT /:id`、`DELETE /:id`、`PATCH /:id/status`
- 响应格式：`{ data, pagination: { page, limit, total, totalPages } }`
- Slugify 工具：保留中文，英文转小写，空格转连字符，冲突加数字后缀

### Task 1.5 分类与标签 API
- 分类：GET 列表/详情（公开）、POST/PUT/DELETE（认证）
- 标签：GET 列表（公开）、POST/PUT/DELETE（认证）
- 列表返回含文章数

### Task 1.6 前端框架搭建与路由
- React Router v6 路由结构按 Task.md §路由结构
- Layout（Header + Footer）+ AdminLayout（Sidebar + 内容区）
- axios client 封装（baseURL + Token 拦截器 + 401 重定向）

### Task 1.7 前端文章展示
- 参考 [Docs/前端设计/anime-blog-prototype.html] 实现首页卡片布局
- 参考 [Docs/前端设计/article-detail.html] 实现文章详情布局
- 侧边栏：个人资料、导航统计、标签云
- 暂不实现：主题切换、Banner 视觉效果（Phase 3）

### Task 1.8 管理后台前端
- 登录页面 → JWT 存 localStorage → 路由守卫
- PostManager：表格展示 + 编辑/删除/切换状态
- PostEditor：左侧 textarea + 右侧实时预览 + 工具栏
- CategoryManager / TagManager：表格 + 弹窗 CRUD

### Task 1.9 Phase 1 集成测试
- 按 Task.md 验证清单逐项确认

## 4. 参考文档

- [Project.md](Project.md) — 架构、数据库、API 设计
- [Task.md](Task.md) — 任务分解
- [coding.md](coding.md) — 编码规范
- [Docs/前端设计/anime-blog-prototype.html](Docs/前端设计/anime-blog-prototype.html) — 首页原型
- [Docs/前端设计/article-detail.html](Docs/前端设计/article-detail.html) — 文章详情原型
