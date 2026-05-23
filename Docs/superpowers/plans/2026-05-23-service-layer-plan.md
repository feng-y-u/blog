# 服务层重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将数据库操作和业务逻辑从控制器抽取到服务层，7 个服务文件 + 7 个控制器同步改造

**Architecture:** 每个资源一个服务文件（`server/src/services/`），控制器变薄仅处理 HTTP 协议，服务返回纯数据对象

**Tech Stack:** Node.js + Express + Prisma

---

## 文件结构

### 新建文件（7 个）

| 文件 | 职责 |
|------|------|
| `server/src/services/tag-service.js` | 标签 CRUD + slug 生成 |
| `server/src/services/category-service.js` | 分类 CRUD + slug 生成 + 关联解除 |
| `server/src/services/settings-service.js` | 站点设置 upsert 事务 |
| `server/src/services/comment-service.js` | 评论 CRUD + HTML 转义 + 级联删除 |
| `server/src/services/post-service.js` | 文章 CRUD + 标签关联 + viewCount + reshapeTags |
| `server/src/services/note-service.js` | 笔记 CRUD + 文件导入 |
| `server/src/services/auth-service.js` | 登录验证 + JWT 签发 + 用户查询 |

### 修改文件（7 个）

| 文件 | 变化 |
|------|------|
| `server/src/controllers/tag-controller.js` | prisma → tagService |
| `server/src/controllers/category-controller.js` | prisma → categoryService |
| `server/src/controllers/settings-controller.js` | prisma → settingsService |
| `server/src/controllers/comment-controller.js` | prisma → commentService |
| `server/src/controllers/post-controller.js` | prisma → postService |
| `server/src/controllers/note-controller.js` | prisma → noteService |
| `server/src/controllers/auth-controller.js` | prisma + bcrypt + jwt → authService |

---

### Task 1: Tag 服务 + 控制器

**Files:**
- Create: `server/src/services/tag-service.js`
- Modify: `server/src/controllers/tag-controller.js`

- [ ] **Step 1: 创建 `tag-service.js`**

```js
const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list() {
  return prisma.tag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })
}

async function getById(id) {
  return prisma.tag.findUnique({ where: { id } })
}

async function create({ name }) {
  const slug = await uniqueSlug(prisma, 'tag', name)
  return prisma.tag.create({ data: { name, slug } })
}

async function update(id, { name }) {
  const existing = await prisma.tag.findUnique({ where: { id } })
  if (!existing) return null
  return prisma.tag.update({ where: { id }, data: { name } })
}

async function remove(id) {
  const existing = await prisma.tag.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.postTag.deleteMany({ where: { tagId: id } })
  await prisma.tag.delete({ where: { id } })
  return true
}

module.exports = { list, getById, create, update, remove }
```

- [ ] **Step 2: 改造 `tag-controller.js`**

删除开头的 `const prisma = require('../utils/prisma')` 和 `const { uniqueSlug } = require('../utils/slugify')`，替换为：

```js
const tagService = require('../services/tag-service')
```

然后修改每个方法：

```js
async function list(req, res, next) {
  try {
    const data = await tagService.list()
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ data })
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: '标签名称不能为空' })
    const tag = await tagService.create({ name })
    res.status(201).json({ data: tag })
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name } = req.body
    const tag = await tagService.update(id, { name })
    if (!tag) return res.status(404).json({ error: '标签不存在' })
    res.json({ data: tag })
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await tagService.remove(id)
    if (!ok) return res.status(404).json({ error: '标签不存在' })
    res.json({ data: { id } })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证**

```bash
cd e:/Blog/server && npm run dev
```

测试端点：`GET /api/tags`、`POST /api/tags`、`PUT /api/tags/:id`、`DELETE /api/tags/:id`

---

### Task 2: Category 服务 + 控制器

**Files:**
- Create: `server/src/services/category-service.js`
- Modify: `server/src/controllers/category-controller.js`

- [ ] **Step 1: 创建 `category-service.js`**

```js
const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')

async function list() {
  return prisma.category.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })
}

async function getBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  })
  return category
}

async function create({ name, description }) {
  const slug = await uniqueSlug(prisma, 'category', name)
  return prisma.category.create({ data: { name, slug, description } })
}

async function update(id, { name, description }) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return null
  const data = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description
  return prisma.category.update({ where: { id }, data })
}

async function remove(id) {
  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.note.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.category.delete({ where: { id } })
  return true
}

module.exports = { list, getBySlug, create, update, remove }
```

- [ ] **Step 2: 改造 `category-controller.js`**

删除 `const prisma = require('../utils/prisma')` 和 `const { uniqueSlug } = require('../utils/slugify')`，替换为 `const categoryService = require('../services/category-service')`。

```js
async function list(req, res, next) {
  try {
    const data = await categoryService.list()
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ data })
  } catch (err) { next(err) }
}

async function getBySlug(req, res, next) {
  try {
    const category = await categoryService.getBySlug(req.params.slug)
    if (!category) return res.status(404).json({ error: '分类不存在' })
    res.json({ data: category })
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { name, description } = req.body
    if (!name) return res.status(400).json({ error: '分类名称不能为空' })
    const category = await categoryService.create({ name, description })
    res.status(201).json({ data: category })
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const { name, description } = req.body
    const category = await categoryService.update(id, { name, description })
    if (!category) return res.status(404).json({ error: '分类不存在' })
    res.json({ data: category })
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await categoryService.remove(id)
    if (!ok) return res.status(404).json({ error: '分类不存在' })
    res.json({ data: { id } })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试分类接口

---

### Task 3: Settings 服务 + 控制器

**Files:**
- Create: `server/src/services/settings-service.js`
- Modify: `server/src/controllers/settings-controller.js`

- [ ] **Step 1: 创建 `settings-service.js`**

```js
const prisma = require('../utils/prisma')

function toObject(rows) {
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
}

async function getAll() {
  const settings = await prisma.setting.findMany()
  return toObject(settings)
}

async function update(entries) {
  const ops = Object.entries(entries).map(([key, value]) =>
    prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  )
  await prisma.$transaction(ops)
  const settings = await prisma.setting.findMany()
  return toObject(settings)
}

module.exports = { getAll, update }
```

- [ ] **Step 2: 改造 `settings-controller.js`**

删除 `const prisma = require('../utils/prisma')` 和函数 `toObject`，替换为：

```js
const settingsService = require('../services/settings-service')
```

```js
exports.getAll = async (req, res, next) => {
  try {
    const data = await settingsService.getAll()
    res.json({ data })
  } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
  try {
    const data = await settingsService.update(req.body)
    res.json({ data })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试 settings 接口

---

### Task 4: Comment 服务 + 控制器

**Files:**
- Create: `server/src/services/comment-service.js`
- Modify: `server/src/controllers/comment-controller.js`

- [ ] **Step 1: 创建 `comment-service.js`**

```js
const prisma = require('../utils/prisma')

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function listByPost(postId) {
  return prisma.comment.findMany({
    where: { postId, status: 'approved', parentId: null },
    include: {
      replies: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

async function create(postId, { authorName, authorEmail, content, parentId }) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw Object.assign(new Error('文章不存在'), { statusCode: 404 })

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: +parentId } })
    if (!parent || parent.postId !== postId) {
      throw Object.assign(new Error('父评论不存在'), { statusCode: 400 })
    }
  }

  return prisma.comment.create({
    data: {
      postId,
      authorName: escapeHtml(authorName),
      authorEmail,
      content: escapeHtml(content),
      parentId: parentId ? +parentId : null,
      status: 'pending',
    },
  })
}

async function listAll({ page = 1, limit = 20, status } = {}) {
  page = +page; limit = Math.min(+limit, 100)
  const where = {}
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { post: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where }),
  ])

  return { data, total, page, limit }
}

async function update(id, { status, content }) {
  const existing = await prisma.comment.findUnique({ where: { id } })
  if (!existing) return null

  const data = {}
  if (status) data.status = status
  if (content !== undefined) data.content = content

  return prisma.comment.update({ where: { id }, data })
}

async function remove(id) {
  const existing = await prisma.comment.findUnique({ where: { id } })
  if (!existing) return null

  await prisma.comment.deleteMany({ where: { parentId: id } })
  await prisma.comment.delete({ where: { id } })
  return true
}

module.exports = { listByPost, create, listAll, update, remove }
```

- [ ] **Step 2: 改造 `comment-controller.js`**

删除 `const prisma = require('../utils/prisma')` 和 `escapeHtml` 函数，替换为：

```js
const commentService = require('../services/comment-service')
```

```js
async function listByPost(req, res, next) {
  try {
    const postId = +req.params.postId
    const data = await commentService.listByPost(postId)
    res.json({ data })
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const postId = +req.params.postId
    const { authorName, authorEmail, content, parentId } = req.body

    if (!authorName || !content) {
      return res.status(400).json({ error: '昵称和内容不能为空' })
    }

    const comment = await commentService.create(postId, { authorName, authorEmail, content, parentId })
    res.status(201).json({ data: comment })
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message })
    next(err)
  }
}

async function listAll(req, res, next) {
  try {
    const result = await commentService.listAll(req.query)
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const comment = await commentService.update(id, req.body)
    if (!comment) return res.status(404).json({ error: '评论不存在' })
    res.json({ data: comment })
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await commentService.remove(id)
    if (!ok) return res.status(404).json({ error: '评论不存在' })
    res.json({ data: { id } })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试评论接口

---

### Task 5: Post 服务 + 控制器

**Files:**
- Create: `server/src/services/post-service.js`
- Modify: `server/src/controllers/post-controller.js`

- [ ] **Step 1: 创建 `post-service.js`**

```js
const prisma = require('../utils/prisma')
const { uniqueSlug } = require('../utils/slugify')
const { POST_STATUS } = require('../constants')

function reshapeTags(post) {
  return { ...post, tags: (post.tags || []).map(pt => pt.tag) }
}

async function list({ page = 1, limit = 10, category, tag, status, search, user } = {}) {
  page = +page; limit = Math.min(+limit, 100)
  const where = {}

  if (category) where.category = { slug: category }
  if (tag) where.tags = { some: { tag: { slug: tag } } }
  if (status) where.status = status
  else if (!user) where.status = POST_STATUS.PUBLISHED
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
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.post.count({ where }),
  ])

  return { data: data.map(reshapeTags), total, page, limit }
}

async function getBySlug(slug, user) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      author: { select: { id: true, displayName: true, avatar: true } },
    },
  })
  if (!post || (post.status !== POST_STATUS.PUBLISHED && !user)) return null

  await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
  return reshapeTags(post)
}

async function getById(id) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  })
  return post ? reshapeTags(post) : null
}

async function create(data) {
  const { title, content, excerpt, coverImage, status, categoryId, tagIds, authorId } = data
  const slug = await uniqueSlug(prisma, 'post', title)

  const post = await prisma.post.create({
    data: {
      title, slug, content, excerpt, coverImage,
      status: status || POST_STATUS.DRAFT,
      publishedAt: status === POST_STATUS.PUBLISHED ? new Date() : null,
      categoryId: categoryId || null,
      authorId,
      tags: tagIds?.length ? { create: tagIds.map(tagId => ({ tagId })) } : undefined,
    },
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function update(id, data) {
  const { title, content, excerpt, coverImage, status, categoryId, tagIds } = data
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null

  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (excerpt !== undefined) updateData.excerpt = excerpt
  if (coverImage !== undefined) updateData.coverImage = coverImage
  if (status !== undefined) {
    updateData.status = status
    if (status === POST_STATUS.PUBLISHED && !existing.publishedAt) updateData.publishedAt = new Date()
  }
  if (categoryId !== undefined) updateData.categoryId = categoryId || null

  if (tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: id } })
    if (tagIds.length) {
      await prisma.postTag.createMany({ data: tagIds.map(tagId => ({ postId: id, tagId })) })
    }
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function remove(id) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.post.delete({ where: { id } })
  return true
}

async function updateStatus(id, status) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) return null

  const data = { status }
  if (status === POST_STATUS.PUBLISHED) data.publishedAt = new Date()

  const post = await prisma.post.update({
    where: { id },
    data,
    include: { category: true, tags: { include: { tag: true } } },
  })

  return reshapeTags(post)
}

async function getAdjacentPosts(id) {
  const [prev, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { id: { lt: id }, status: POST_STATUS.PUBLISHED },
      orderBy: { id: 'desc' },
      select: { id: true, title: true, slug: true },
    }),
    prisma.post.findFirst({
      where: { id: { gt: id }, status: POST_STATUS.PUBLISHED },
      orderBy: { id: 'asc' },
      select: { id: true, title: true, slug: true },
    }),
  ])
  return { prev, next: nextPost }
}

module.exports = { list, getBySlug, getById, create, update, remove, updateStatus, getAdjacentPosts }
```

- [ ] **Step 2: 改造 `post-controller.js`**

删除开头的 `const prisma = require('../utils/prisma')`、`const { uniqueSlug } = require('../utils/slugify')`、`const { POST_STATUS } = require('../constants')` 以及 `reshapeTags` 函数，替换为：

```js
const postService = require('../services/post-service')
```

```js
async function list(req, res, next) {
  try {
    const result = await postService.list({ ...req.query, user: req.user })
    res.set('Cache-Control', 'public, max-age=300')
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    })
  } catch (err) { next(err) }
}

async function getBySlug(req, res, next) {
  try {
    const post = await postService.getBySlug(req.params.slug, req.user)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const { title, content, excerpt, coverImage, status, categoryId, tagIds } = req.body
    if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' })

    const post = await postService.create({
      title, content, excerpt, coverImage, status, categoryId, tagIds,
      authorId: req.user.sub,
    })
    res.status(201).json({ data: post })
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const post = await postService.update(id, req.body)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await postService.remove(id)
    if (!ok) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: { id } })
  } catch (err) { next(err) }
}

async function updateStatus(req, res, next) {
  try {
    const id = +req.params.id
    const { status } = req.body
    const post = await postService.updateStatus(id, status)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const id = +req.params.id
    const post = await postService.getById(id)
    if (!post) return res.status(404).json({ error: '文章不存在' })
    res.json({ data: post })
  } catch (err) { next(err) }
}

async function getAdjacentPosts(req, res, next) {
  try {
    const id = +req.params.id
    const result = await postService.getAdjacentPosts(id)
    res.json({ data: result })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试文章接口（CRUD、搜索、上下篇）

---

### Task 6: Note 服务 + 控制器

**Files:**
- Create: `server/src/services/note-service.js`
- Modify: `server/src/controllers/note-controller.js`

- [ ] **Step 1: 创建 `note-service.js`**

```js
const prisma = require('../utils/prisma')
const fs = require('fs/promises')

async function listPublic({ page = 1, limit = 20 } = {}) {
  page = +page; limit = Math.min(+limit, 100)

  const [data, total] = await Promise.all([
    prisma.note.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.note.count(),
  ])

  return { data, total, page, limit }
}

async function list({ page = 1, limit = 20, categoryId } = {}) {
  page = +page; limit = Math.min(+limit, 100)
  const where = {}
  if (categoryId) where.categoryId = +categoryId

  const [data, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.note.count({ where }),
  ])

  return { data, total, page, limit }
}

async function getById(id) {
  return prisma.note.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function create(data) {
  let title, content, categoryId

  if (data.file) {
    title = data.file.originalname.replace(/\.md$/i, '')
    content = await fs.readFile(data.file.path, 'utf-8')
    categoryId = data.categoryId ? +data.categoryId : null
  } else {
    title = data.title
    content = data.content
    categoryId = data.categoryId ? +data.categoryId : null
  }

  return prisma.note.create({
    data: { title, content, categoryId, filePath: data.file?.path },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function update(id, { title, content, categoryId }) {
  const existing = await prisma.note.findUnique({ where: { id } })
  if (!existing) return null

  const data = {}
  if (title !== undefined) data.title = title
  if (content !== undefined) data.content = content
  if (categoryId !== undefined) data.categoryId = categoryId || null

  return prisma.note.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true, slug: true } } },
  })
}

async function remove(id) {
  const existing = await prisma.note.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.note.delete({ where: { id } })
  return true
}

async function getForExport(id) {
  return prisma.note.findUnique({ where: { id } })
}

module.exports = { listPublic, list, getById, create, update, remove, getForExport }
```

- [ ] **Step 2: 改造 `note-controller.js`**

删除 `const prisma = require('../utils/prisma')` 和 `const fs = require('fs/promises')`，替换为：

```js
const noteService = require('../services/note-service')
```

```js
async function listPublic(req, res, next) {
  try {
    const result = await noteService.listPublic(req.query)
    res.json({
      data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  } catch (err) { next(err) }
}

async function list(req, res, next) {
  try {
    const result = await noteService.list(req.query)
    res.json({
      data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    })
  } catch (err) { next(err) }
}

async function getById(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.getById(id)
    if (!note) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: note })
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const note = await noteService.create({ ...req.body, file: req.file })
    if (!note.title || !note.content) {
      return res.status(400).json({ error: '标题和内容不能为空' })
    }
    res.status(201).json({ data: note })
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.update(id, req.body)
    if (!note) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: note })
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    const id = +req.params.id
    const ok = await noteService.remove(id)
    if (!ok) return res.status(404).json({ error: '笔记不存在' })
    res.json({ data: { id } })
  } catch (err) { next(err) }
}

async function exportNote(req, res, next) {
  try {
    const id = +req.params.id
    const note = await noteService.getForExport(id)
    if (!note) return res.status(404).json({ error: '笔记不存在' })

    const filename = encodeURIComponent(note.title.replace(/[/\\?%*:|"<>]/g, '_')) + '.md'
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    res.send(note.content)
  } catch (err) { next(err) }
}
```

注意：`create` 中验证 title/content 的检查原本在 `if (!title || !content)` 之前就完成了创建操作。因为服务层需要处理文件读取，所以验证逻辑放在控制器中调用服务之后。需要修正——将验证移到调用服务之前：

```js
async function create(req, res, next) {
  try {
    const title = req.file ? req.file.originalname.replace(/\.md$/i, '') : req.body.title
    const content = req.file ? '来自文件' : req.body.content
    if (!title || !content) {
      return res.status(400).json({ error: '标题和内容不能为空' })
    }
    const note = await noteService.create({ ...req.body, file: req.file })
    res.status(201).json({ data: note })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试笔记接口

---

### Task 7: Auth 服务 + 控制器

**Files:**
- Create: `server/src/services/auth-service.js`
- Modify: `server/src/controllers/auth-controller.js`

- [ ] **Step 1: 创建 `auth-service.js`**

```js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')
const config = require('../config')

async function login(username, password) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return null

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  return {
    token,
    user: { id: user.id, username: user.username, displayName: user.displayName, avatar: user.avatar },
  }
}

async function getMe(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, avatar: true, bio: true, email: true },
  })
}

module.exports = { login, getMe }
```

- [ ] **Step 2: 改造 `auth-controller.js`**

删除 `const bcrypt = require('bcryptjs')`、`const jwt = require('jsonwebtoken')`、`const prisma = require('../utils/prisma')`、`const config = require('../config')`，替换为：

```js
const authService = require('../services/auth-service')
```

```js
async function login(req, res, next) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const result = await authService.login(username, password)
    if (!result) return res.status(401).json({ error: '用户名或密码错误' })

    res.json({ data: result })
  } catch (err) { next(err) }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.sub)
    if (!user) return res.status(404).json({ error: '用户不存在' })
    res.json({ data: user })
  } catch (err) { next(err) }
}
```

- [ ] **Step 3: 验证** — 启动服务器测试登录和 /me 接口

---

### Task 8: 全局验证

- [ ] **Step 1: 启动服务器**

```bash
cd e:/Blog/server && npm run dev
```

确认启动无报错。

- [ ] **Step 2: 功能回归**

逐项测试：
- `POST /api/auth/login` → 200 + token
- `GET /api/auth/me` → 200 + user info
- `GET /api/posts` → 200 + posts list
- `GET /api/posts/:slug` → 200 + post detail
- `POST /api/posts` → 201 (需认证)
- `PUT /api/posts/:id` → 200 (需认证)
- `GET /api/categories` → 200
- `GET /api/tags` → 200
- `POST /api/comments` → 201
- `GET /api/comments` → 200 (需认证)
- `GET /api/notes/public` → 200
- `GET /api/settings` → 200
- `GET /api/feed` → 200
- `GET /api/sitemap` → 200

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "refactor: 抽取服务层 — 将数据库操作从控制器迁移到 services"
```
