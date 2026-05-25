# 前端页面组件化重构设计

> 日期：2026-05-25
> 状态：待实施

## 1. 目标

对博客前端当前几个大型组件进行拆解，同时统一当前混合的样式风格（Tailwind + inline style + CSS 变量），改为 **CSS 类 + 变量主题**模式：

- **CSS 变量**（`theme.css`）控制主题色、字体、间距等全局 token
- **Tailwind** 用于布局（grid、flex、gap）和间距
- **组件 CSS 文件**管理组件专属样式，消除冗余 inline `style={}`

## 2. 样式架构

```
client/src/styles/
├── index.css          # Tailwind 指令（已有，不动）
├── theme.css          # 主题变量（已有，不动）
├── common.css         # 通用：卡片(.card)、按钮(.btn)、标签(.tag)、链接(.link)
├── article.css        # 文章详情：目录(.toc)、正文排版(.article-body)、元信息(.article-meta)
├── home.css           # 首页：杂志布局(.magazine-*)、页码(.page-indicator)、页脚(.site-footer)
├── sidebar.css        # 侧边栏：资料卡(.profile-card)、统计(.nav-stats)、标签云(.tag-cloud)
└── search.css         # 搜索页：输入框(.search-input)、分类过滤(.category-filter)、空状态(.empty-state)
```

### 2.1 样式迁移规则

| 来源 | 迁移目标 | 条件 |
|------|---------|------|
| `style={{ color: 'var(--x)' }}` | `className="text-fg"` 类 | 纯颜色/背景引用 |
| `onMouseEnter` hover 效果 | CSS `:hover` 伪类 | 所有静态 hover 效果 |
| `<style>{ARTICLE_BODY_CSS}</style>` | `article.css` | 文章排版样式 |
| Tailwind 原子类 | 保留不动 | 布局相关（grid/flex/padding） |

## 3. 组件提取方案

### 3.1 PostDetailPage → 6 个组件

源文件：`pages/PostDetailPage.jsx`（411行 → ~60行）

| 组件 | 路径 | 职责 |
|------|------|------|
| `ArticleMeta` | `components/ArticleMeta.jsx` | 分类标签、发布日期、阅读时间 |
| `ArticleToolbar` | `components/ArticleToolbar.jsx` | 作者名、阅读量、字号 S/M/L 切换 |
| `TableOfContents` | `components/TableOfContents.jsx` | 提取目录树，平滑滚动到标题 |
| `ArticleBody` | `components/ArticleBody.jsx` | ReactMarkdown + 代码高亮 + 图片 Lightbox 触发 |
| `ArticleFooter` | `components/ArticleFooter.jsx` | 标签列表、复制链接、收藏按钮 |
| `AdjacentNav` | `components/AdjacentNav.jsx` | 上/下篇文章导航卡片 |

PostDetailPage 保留：
- `useParams` 获取 slug
- `useState/useEffect` 获取文章数据 + 相邻文章
- 组合上述 6 个组件 + `<CommentSection>`
- loading / error / 404 状态处理

**Props 接口：**
```
PostDetailPage
  └─ ArticleMeta       { category, publishedAt, contentLength }
  └─ ArticleToolbar    { author, viewCount, fontSize, onFontSizeChange }
  └─ TableOfContents   { headings }
  └─ ArticleBody       { content, onImageClick }
  └─ ArticleFooter     { tags, postId, isFavorited, onToggleFavorite, onCopyLink, copied }
  └─ AdjacentNav       { prev, next }
  └─ CommentSection    { postId } — 已有组件
```

### 3.2 HomePage → 5 个组件

源文件：`pages/HomePage.jsx`（235行 → ~80行）

| 组件 | 路径 | 职责 |
|------|------|------|
| `MagazinePage` | `components/MagazinePage.jsx` | 单页容器：编号 + 内容 + 页码 |
| `MagazineNumbering` | `components/MagazineNumbering.jsx` | 左右两侧文章编号 / 页码 |
| `PageIndicator` | `components/PageIndicator.jsx` | 底部圆点导航，点击滚动到对应页 |
| `RestPosts` | `components/RestPosts.jsx` | "More articles" 区域 + 搜索入口 |
| `SiteFooter` | `components/SiteFooter.jsx` | 底部版权信息 + 链接 |

HomePage 保留：
- `useState/useEffect` 获取文章列表
- IntersectionObserver 追踪可见页
- 组装 Splash + MagazinePage[] + PageIndicator + RestPosts + SiteFooter

### 3.3 SearchPage → 4 个组件

源文件：`pages/SearchPage.jsx`（164行 → ~50行）

| 组件 | 路径 | 职责 |
|------|------|------|
| `SearchInput` | `components/SearchInput.jsx` | 搜索输入框 + 防抖 |
| `CategoryFilter` | `components/CategoryFilter.jsx` | 分类筛选按钮组 |
| `SearchResults` | `components/SearchResults.jsx` | 结果列表 + 高亮 + 空状态 |
| `EmptyState` | `components/EmptyState.jsx` | 初始状态提示 |

SearchPage 保留：
- URL searchParams 同步逻辑
- 组合上述 4 个组件

### 3.4 Sidebar → 4 个组件

源文件：`components/Sidebar.jsx`（240行 → ~20行）

| 组件 | 路径 | 职责 |
|------|------|------|
| `ProfileCard` | `components/ProfileCard.jsx` | 头像 + 名称，内嵌 SocialLinks |
| `SocialLinks` | `components/SocialLinks.jsx` | 社交图标列表 |
| `NavStats` | `components/NavStats.jsx` | 文章/笔记/分类数统计 |
| `TagList` | `components/TagList.jsx` | 跨页面复用的标签列表组件 |

### 3.5 跨页面复用组件

| 组件 | 用于 |
|------|------|
| `TagList` | Sidebar 标签云 + ArticleFooter 标签 |
| `Loading` | 已有，不动 |
| `EmptyState` | SearchPage + NotesPage（可复用） |

## 4. 实施顺序

按依赖关系和影响范围排列：

```
Phase 1: CSS 基础
  1.1 创建 common.css — 通用样式类
  1.2 创建 article.css — 文章排版样式
  1.3 创建 home.css — 首页样式
  1.4 创建 search.css — 搜索页样式

Phase 2: 独立组件提取
  2.1 TagList（跨页面复用，优先提取）
  2.2 Sidebar → ProfileCard + SocialLinks + NavStats
  2.3 SiteFooter

Phase 3: PostDetailPage 拆解
  3.1 ArticleMeta + ArticleToolbar
  3.2 TableOfContents
  3.3 ArticleBody
  3.4 ArticleFooter + AdjacentNav
  3.5 整合 PostDetailPage

Phase 4: HomePage 拆解
  4.1 MagazinePage + MagazineNumbering
  4.2 PageIndicator
  4.3 RestPosts
  4.4 整合 HomePage

Phase 5: SearchPage 拆解 + 收尾
  5.1 SearchInput + CategoryFilter
  5.2 SearchResults + EmptyState
  5.3 整合 SearchPage
```

## 5. 不受影响的文件

- `pages/CategoryListPage.jsx`
- `pages/TagCloudPage.jsx`
- `pages/CategoryPage.jsx`
- `pages/TagPage.jsx`
- `pages/NotesPage.jsx`（仅改样式引用）
- 所有后台管理页面
- `components/Layout.jsx`、`Navbar.jsx`
- `components/MagazineSpread.jsx`、`HomeSplash.jsx`
- `components/CommentSection.jsx`、`ReadingProgress.jsx`、`Lightbox.jsx`
- 所有 `api/`、`contexts/`、`utils/` 文件

## 6. 验收标准

- [ ] PostDetailPage ≤ 80 行
- [ ] HomePage ≤ 100 行
- [ ] SearchPage ≤ 60 行
- [ ] Sidebar ≤ 40 行
- [ ] 新增 CSS 文件中不包含 Tailwind `@apply` 指令
- [ ] 所有原 inline hover 效果迁移到 CSS `:hover`
- [ ] 换肤功能不受影响
- [ ] 所有页面功能正常（数据加载、交互、导航）
