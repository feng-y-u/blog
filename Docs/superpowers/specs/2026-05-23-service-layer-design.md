# 服务层重构设计文档

## 动机

控制器（controller）当前直接调用 Prisma 操作数据库，导致：
- **职责混杂**：同一函数内既处理 HTTP 请求/响应，又包含业务逻辑和数据库查询
- **重复代码**：查存在性、reshapeTags、escapeHtml 等逻辑散落在多个控制器
- **不可测试**：控制器与 Express req/res 耦合，无法单独测试业务逻辑
- **难以扩展**：新增功能需要复制粘贴 Prisma 查询模式

## 目标

- 将数据访问和业务逻辑从控制器中抽离到服务层
- 控制器仅负责 HTTP 协议处理（参数解析、状态码、响应头）
- 服务方法返回纯数据对象，不依赖 Express
- 不改变外部接口（API 路由和响应格式不变）

## 架构

```
请求 → 路由 → 中间件 → 控制器 → 服务 → Prisma → SQLite
                         ↓
                    HTTP 响应
```

- 控制器：解析 `req`，调服务，发 `res`
- 服务：业务逻辑 + 数据访问，返回 JS 对象，可抛出错误

## 目录结构

```
server/src/
  services/
    post-service.js       # 文章相关
    comment-service.js    # 评论相关
    category-service.js   # 分类相关
    tag-service.js        # 标签相关
    note-service.js       # 笔记相关
    auth-service.js       # 认证相关
    settings-service.js   # 站点设置相关
  controllers/            # 保持不变（只修改内部实现）
    post-controller.js    # 调 post-service
    comment-controller.js # 调 comment-service
    ...
```

不抽取服务的控制器：
- `upload-controller.js` — 无数据库操作
- `feed-controller.js` — 单一只读查询，不值得加一层
- `sitemap-controller.js` — 同上

## 服务接口设计

### post-service.js

```js
// 文章列表（支持分页、筛选、搜索）
async function list({ page, limit, category, tag, status, search, user }) → { posts, total }

// 按 slug 获取单篇文章（自动 increment viewCount）
async function getBySlug(slug, user?) → post | null

// 按 ID 获取文章
async function getById(id) → post | null

// 创建文章（自动生成 slug、关联标签）
async function create({ title, content, excerpt, coverImage, status, categoryId, tagIds, authorId }) → post

// 更新文章（重建标签关联）
async function update(id, data) → post | null

// 删除文章
async function remove(id) → void

// 更新发布状态（首次发布自动设 publishedAt）
async function updateStatus(id, status) → post | null

// 获取上下篇文章
async function getAdjacentPosts(id) → { prev, next }
```

### comment-service.js

```js
async function listByPost(postId) → comments
async function create(postId, { authorName, authorEmail, content, parentId }) → comment
async function listAll({ page, limit, status }) → { comments, total }
async function update(id, { status?, content? }) → comment | null
async function remove(id) → void  // 级联删除回复
```

### category-service.js

```js
async function list() → categories
async function getBySlug(slug) → category | null
async function create({ name, description }) → category
async function update(id, { name?, description? }) → category | null
async function remove(id) → void  // 解绑文章/笔记后删除
```

### tag-service.js

```js
async function list() → tags
async function create({ name }) → tag
async function update(id, { name }) → tag | null
async function remove(id) → void  // 删除关联后删除
```

### note-service.js

```js
async function listPublic({ page, limit }) → { notes, total }
async function list({ page, limit, categoryId }) → { notes, total }
async function getById(id) → note | null
async function create({ title?, content?, categoryId?, file? }) → note
async function update(id, { title?, content?, categoryId? }) → note | null
async function remove(id) → void
async function exportNote(id) → { content, title } | null
```

### auth-service.js

```js
async function login(username, password) → { token, user }  // bcrypt + jwt
async function getMe(userId) → user | null
```

### settings-service.js

```js
async function getAll() → object  // { key: value, ... }
async function update(entries) → object  // upsert 事务
```

## 控制器改动

控制器整体变薄，模式统一：

```js
// 改造前
async function list(req, res, next) {
  try {
    const data = await prisma.post.findMany({ ... })
    const total = await prisma.post.count({ ... })
    res.json({ data, pagination })
  } catch (err) { next(err) }
}

// 改造后
async function list(req, res, next) {
  try {
    const result = await postService.list(req.query)
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ data: result.posts, pagination: result.pagination })
  } catch (err) { next(err) }
}
```

具体变化：
- `const prisma = require(...)` → `const postService = require(...)`
- 所有 `prisma.xxx` 调用替换为 `xxxService.yyy()` 调用
- 响应逻辑（`res.json`、`res.status`、缓存头）保留在控制器
- `escapeHtml`、`reshapeTags` 等辅助函数移入对应服务
- 验证逻辑（非空检查、存在性检查）保留在控制器或移入服务（按就近原则）

## 迁移步骤

分 3 批完成，每批可独立测试：

### 第一批：纯数据服务（无外部依赖）
1. `tag-service.js` — 最轻量，快速验证模式
2. `category-service.js`
3. `settings-service.js`

### 第二批：核心内容
4. `comment-service.js`
5. `post-service.js` — 最复杂，含 reshapeTags、adjacent posts、viewCount

### 第三批：剩余
6. `note-service.js`
7. `auth-service.js`

每步做完运行 `npm run dev` 确认接口正常。

## 验证方式

- 启动后端：`cd server && npm run dev`
- 各 API 端点返回与重构前一致的响应格式
- 功能回归：文章 CRUD、评论、搜索、RSS、Sitemap
