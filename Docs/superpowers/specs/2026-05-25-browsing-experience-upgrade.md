# 浏览体验升级设计

## 概述

对博客列表页、卡片、标签云、笔记页等浏览界面进行统一升级，提升信息密度和视觉层次感。不涉及首页杂志布局和文章阅读页。

## 改动清单

### 1. PostCard 升级（顶部横幅封面图）

将 `PostCard` 从纯文字卡片升级为带顶部封面图的视觉卡片。

**布局：**
```
┌──────────────────────────────────┐
│        封面图横幅 180px          │  ← coverImage（16:9 裁剪）
├──────────────────────────────────┤
│ TECH · 2026/05/25 · 5 min        │  ← 元信息行
│                                  │
│ React 18 新特性一览               │  ← 标题
│                                  │
│ React 18 带来了 Concurrent…      │  ← 摘要 2行截断
│                                  │
│ [react]  [javascript]             │  ← 标签
└──────────────────────────────────┘
```

- 有 `coverImage` 时显示横幅，无则隐藏封面区域（`display: none`），卡片不占位
- 元信息行始终显示：分类、日期、阅读时长（`Math.ceil(content.length / 500) + " min read"`，中文 500 字/分钟估算）
- 摘要默认显示，2 行截断（`-webkit-line-clamp: 2`）
- 标签默认显示，最多 4 个
- 移除 `showExcerpt` / `showTags` props
- 添加 `border-top: 3px solid var(--accent-pink)` 当有封面图时
- hover: `translateY(-2px)` + `shadow-lg`
- 卡片使用 `.post-card` 类，新增 `.post-card-cover` / `.post-card-reading-time` 等类

**使用范围：** 分类页、标签页、搜索页、RestPosts

### 2. 分类/标签页头部

**分类页：**
- 原有 `← 所有分类` 返回链接
- 分类头部卡片：分类名 + 文章数 + 分类描述 + 底部粉色装饰线
- 使用已有 `.card` 类，内联结构

**标签页：**
- 原有 `← 所有标签` 返回链接
- 标签头部卡片：标签名 + 文章数（标签无描述字段，跳过）

**标签云页：**
- 标签字体大小按 `_count.posts` 加权：`font-size: clamp(12px, 12px + count * 2px, 28px)`
- 颜色从粉色到深粉渐变
- 保持现有 `.tag` 样式

### 3. 笔记卡片升级

`NotesPage` 现有卡片改为：
- 保留 `.notes-grid` 2列网格布局和 `.card` 样式
- 新增 Markdown 纯文本预览：提取 `note.content` 中纯文本前 100 字
- 底部元信息行：分类名 + 相对时间（`formatTime`） 
- 无封面图，保持笔记简洁风格

### 4. 搜索页结果 + RestPosts

**搜索页：**
- 结果卡片改用与 PostCard 一致的样式（复用但保留关键词高亮）
- 搜索框、分类筛选、空状态保持不变

**RestPosts（首页杂志区下方）：**
- 改用升级后的 PostCard 组件，与分类/标签页风格一致
- 去掉原有的独立链接列表样式

### 5. Loading 骨架屏

`Loading` 组件从纯文字改为 3 行脉冲动画灰色条：
- 脉冲动画使用 CSS `@keyframes pulse`
- 3 行长度不同（100%、80%、60%），模拟文章卡片骨架
- 保持在 `.loading` 类中

## 涉及文件

| 文件 | 改动 |
|------|------|
| `client/src/components/PostCard.jsx` | 全面重写 — 封面图、阅读时长、摘要/标签默认显示 |
| `client/src/components/Loading.jsx` | 文字 → 骨架屏 |
| `client/src/pages/CategoryPage.jsx` | 添加分类头部卡片 |
| `client/src/pages/TagPage.jsx` | 添加标签头部卡片 |
| `client/src/pages/TagCloudPage.jsx` | 标签字号加权 |
| `client/src/pages/NotesPage.jsx` | 添加 Markdown 预览 + 底部元信息 |
| `client/src/components/RestPosts.jsx` | 改用 PostCard |
| `client/src/components/SearchResults.jsx` | 结果卡片样式对齐 PostCard |
| `client/src/styles/common.css` | 新增 PostCard 封面、骨架屏等样式 |
| `server/prisma/seed-sample.js` | 添加封面图 URL |

## 样式的组合方式

新增 PostCard 相关 CSS 类追加到 `common.css`，不新增 CSS 文件。所有组件使用 `.post-card-*` / `.skeleton-*` 类名，不增加内联 style。
