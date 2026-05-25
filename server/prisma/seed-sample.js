const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 1. 删除旧数据
  await prisma.comment.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.note.deleteMany()
  console.log('已删除所有旧文章、评论和笔记')

  // 2. 获取已有分类和标签
  const [tech, life, noteCat] = await Promise.all([
    prisma.category.findUnique({ where: { slug: 'tech' } }),
    prisma.category.findUnique({ where: { slug: 'life' } }),
    prisma.category.findUnique({ where: { slug: 'note' } }),
  ])

  const [js, react, node, css, essay] = await Promise.all([
    prisma.tag.findUnique({ where: { slug: 'javascript' } }),
    prisma.tag.findUnique({ where: { slug: 'react' } }),
    prisma.tag.findUnique({ where: { slug: 'nodejs' } }),
    prisma.tag.findUnique({ where: { slug: 'css' } }),
    prisma.tag.findUnique({ where: { slug: 'essay' } }),
  ])

  const admin = await prisma.user.findUnique({ where: { username: 'admin' } })

  // 3. 创建示例文章
  const articles = [
    {
      title: 'React 18 新特性一览',
      slug: 'react-18-new-features',
      coverImage: 'https://picsum.photos/seed/react18/800/450',
      content: `## 前言

React 18 带来了许多令人兴奋的新特性。本文将逐一介绍这些变化。

## Concurrent Mode

并发模式是 React 18 最重要的更新。它允许 React 同时准备多个版本的 UI：

\`\`\`jsx
import { startTransition } from 'react'

startTransition(() => {
  setSearchQuery(input)
})
\`\`\`

### 自动批处理

React 18 默认启用自动批处理，多个 setState 调用会被合并：

\`\`\`jsx
function handleClick() {
  setCount(c => c + 1)
  setFlag(f => !f)
  // 只触发一次重渲染
}
\`\`\`

## useTransition

\`useTransition\` 允许你将某些更新标记为非紧急：

\`\`\`jsx
function SearchPage() {
  const [isPending, startTransition] = useTransition()

  function handleChange(e) {
    const value = e.target.value
    startTransition(() => {
      setSearchQuery(value)
    })
  }
}
\`\`\`

## 总结

React 18 的改进让前端开发更加高效，推荐所有项目升级到最新版本。`,
      excerpt: 'React 18 带来了 Concurrent Mode、自动批处理和 useTransition 等重磅更新，本文详细介绍这些新特性的用法。',
      categoryId: tech.id,
      tags: [react.id, js.id],
      status: 'published',
      publishedAt: new Date('2026-05-20'),
    },
    {
      title: '现代 CSS 布局技巧',
      slug: 'modern-css-layout',
      coverImage: 'https://picsum.photos/seed/csslayout/800/450',
      content: `## Grid 布局

CSS Grid 是目前最强大的布局系统：

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
\`\`\`

## Flexbox 实战

Flexbox 适合一维布局：

\`\`\`css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
\`\`\`

## Container Queries

容器查询让组件可以基于自身容器宽度调整样式：

\`\`\`css
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
\`\`\`

## 色彩变量

CSS 变量让主题系统变得简单：

\`\`\`css
:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --accent: #E72D48;
}

:root[data-theme="dark"] {
  --bg: #0d0d14;
  --fg: #e4e4ed;
}
\`\`\`

CSS 的发展日新月异，这些新特性值得我们投入时间学习。`,
      excerpt: '从 Grid 到 Container Queries，现代 CSS 提供了前所未有的布局能力。本文整理了几个实用的布局技巧。',
      categoryId: tech.id,
      tags: [css.id],
      status: 'published',
      publishedAt: new Date('2026-05-18'),
    },
    {
      title: 'Node.js 后端开发入门',
      slug: 'nodejs-backend-guide',
      coverImage: 'https://picsum.photos/seed/nodejs/800/450',
      content: `## 为什么选择 Node.js

Node.js 以其非阻塞 I/O 和事件驱动架构闻名，非常适合构建高并发的 Web 应用。

## Express 框架

Express 是最流行的 Node.js Web 框架：

\`\`\`javascript
const express = require('express')
const app = express()

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' })
})
\`\`\`

## 中间件模式

Express 的中间件机制非常灵活：

\`\`\`javascript
app.use(express.json())
app.use(cors())
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`)
  next()
})
\`\`\`

## 数据库集成

使用 Prisma ORM 管理数据库：

\`\`\`javascript
const posts = await prisma.post.findMany({
  where: { status: 'published' },
  include: { category: true, tags: true },
  orderBy: { publishedAt: 'desc' },
})
\`\`\`

Node.js 生态丰富，是后端开发的不错选择。`,
      excerpt: '适合初学者的 Node.js 后端开发指南，涵盖 Express 框架、中间件模式和 Prisma ORM 集成。',
      categoryId: tech.id,
      tags: [node.id, js.id],
      status: 'published',
      publishedAt: new Date('2026-05-15'),
    },
    {
      title: '周末的料理时光',
      slug: 'weekend-cooking',
      coverImage: 'https://picsum.photos/seed/cooking/800/450',
      content: `## 厨房里的治愈

周末最适合做些需要耐心的事情。最近迷上了做面包，从揉面到发酵，每一步都需要等待。

### 简单的配方

最近尝试了一个免揉面包的配方：

- 高筋面粉 300g
- 水 240ml
- 酵母 3g
- 盐 5g

只需要把所有材料混合，静置 12 小时以上，然后烤制即可。

## 慢生活

做面包的过程让我体会到：有些事情急不来。等待面团发酵的时间里，可以看一本书，听一张专辑，或者就安静地坐着。

> "生活的意义不在于速度，而在于深度。"

烘焙和写代码其实很像，都需要耐心和 precision。不同的是，面包烤坏了可以重来，代码上线前要仔细测试（笑）。`,
      excerpt: '周末做面包的经历，以及从中领悟到的关于生活和代码的思考。',
      categoryId: life.id,
      tags: [essay.id],
      status: 'published',
      publishedAt: new Date('2026-05-10'),
    },
  ]

  for (const article of articles) {
    const { tags: tagIds, ...data } = article
    const post = await prisma.post.create({
      data: {
        ...data,
        authorId: admin.id,
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
    })
    console.log('创建文章:', post.title)
  }

  // 4. 创建示例笔记
  const notes = [
    {
      title: 'Prisma 常用查询语法',
      content: '## findMany\n```\nprisma.post.findMany({ where: { status: "published" }, include: { category: true } })\n```\n\n## create\n```\nprisma.post.create({ data: { title, content, authorId } })\n```\n\n## upsert\n```\nprisma.category.upsert({ where: { name }, update: {}, create: { name, slug } })\n```',
      categoryId: noteCat.id,
    },
    {
      title: 'Git 常用命令速查',
      content: '## Branch\n- \`git branch -a\` 查看所有分支\n- \`git checkout -b feat/new\` 创建并切换\n\n## Commit\n- \`git commit -m "feat: ..."\` 提交\n- \`git commit --amend\` 修改上次提交\n\n## Rebase\n- \`git rebase main\` 变基\n- \`git rebase -i HEAD~3\` 交互式变基',
      categoryId: noteCat.id,
    },
    {
      title: 'REST API 设计规范',
      content: '## URL 命名\n- 使用名词复数: \`/api/posts\`\n- 嵌套资源: \`/api/posts/:id/comments\`\n\n## HTTP 方法\n- GET: 获取资源\n- POST: 创建资源\n- PUT: 更新资源\n- DELETE: 删除资源\n\n## 响应格式\n\`\`\`json\n{\n  "data": { ... },\n  "pagination": { "page": 1, "total": 10 }\n}\n\`\`\`',
      categoryId: noteCat.id,
    },
  ]

  for (const note of notes) {
    await prisma.note.create({ data: note })
    console.log('创建笔记:', note.title)
  }

  console.log('\\n示例数据创建完成！')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
