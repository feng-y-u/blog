# AGENTS.md — 个人博客系统 (Personal Blog)

纯静态博客：React 19 + Vite（client），内容为 Markdown 文件（content/），构建脚本生成静态数据，部署到 Cloudflare Pages。无后端、无数据库、无 TypeScript、无测试、无 lint。遵循 `coding.md`；不要添加它禁止的东西。

## Warning: docs are stale
`CLAUDE.md`、`Project.md`、`Task.md` 描述的是旧架构（Express + Prisma + SQLite 后端），已废弃。当前架构设计见 `Docs/superpowers/specs/2026-08-14-static-site-design.md`，实施计划见 `Docs/superpowers/plans/2026-08-14-static-site.md`。

## Setup (fresh clone)
```bash
cd client && npm install && npm run dev
```
- `npm run dev` / `npm run build` 会先运行 `node scripts/build-content.mjs` 生成静态数据，再启动 vite / 构建
- 构建产物 `client/public/data/*.json`、`sitemap.xml`、`robots.txt`、`images/` 已 gitignore（内容源在 `content/`）

## 内容（content/）
- `content/posts/<YYYY-MM-DD>-<slug>.md`：一篇文章一个文件。slug 与日期从文件名推导，标题取 frontmatter.title 或正文第一个 H1 或文件名；frontmatter 完全可选（title/category/tags/coverImage/excerpt/jpChar/date）
- `content/notes/*.md`：笔记，标题同文章推导规则
- `content/config.json`：站点设置（site_title/profile_name/avatar_emoji/social_links 等）
- `content/images/`：文章图片，构建时复制到 `client/public/images/`
- 分类/标签从所有文章的 frontmatter 自动收集，无需单独维护

## 部署（Cloudflare Pages）
```bash
cd client && npm run build
npx wrangler pages deploy client/dist
```
- `client/public/_redirects`：SPA 路由回退（`/* /index.html 200`）；`_headers`：缓存策略与安全头
- 域名：flowyu.xyz 系列

## 前端架构
- 数据流：`client/src/api/*.js` 读取 `/data/*.json` 并做前端过滤（分页/搜索/分类/标签），保持 `{ data, pagination }` 返回形状
- 页面全部懒加载（React.lazy）；样式为自定义 CSS（main.jsx 导入 index/theme/common/article/sidebar/search.css）
- 暗色模式：`data-theme` 属性 + localStorage `blog-theme`
- 收藏/阅读进度/浏览量等为 localStorage 本地实现（无服务端）

## Conventions
- Commit: `<type>(<scope>): 中文描述` — 类型 `feat|fix|refactor|chore|docs|style`；单 `main` + `feature` 分支
- UI 文本中文，代码注释英文，提交信息中文
- 命名：组件 PascalCase、hooks `use*.js`、api helpers camelCase
- 文件大小上限（coding.md §1.3）：组件 ≤250 行
