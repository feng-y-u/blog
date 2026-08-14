# 写作工具设计（/writer 路由）

日期：2026-08-14
分支：feature（实验分支）
状态：已批准（含自审修正）

## 1. 背景与目标

纯静态化后文章 = `content/posts/*.md`，但手写 frontmatter、手动复制图片很不方便。目标：在博客内提供 `/writer` 写作工具——可视化设置封面/分类/标签、插入图片（自动复制）、实时预览、导入已有 md，保存时自动生成文件名与 frontmatter。

## 2. 形态

- 集成到博客的 `/writer` 隐藏路由（App.jsx 注册，导航不显示入口）
- **复用现有样式与渲染链**：markdown 预览用 `ArticleBody`（react-markdown + GFM + 代码高亮），卡片预览用 `PostCard`——保证所见即所得
- 独立全屏布局（不套 Layout 侧边栏/页脚）
- 零后端、零新增运行时依赖；仅 Chromium（Chrome/Edge）支持 File System Access，其他浏览器显示引导提示

## 3. 文件系统机制（File System Access）

- 首次使用：`showDirectoryPicker()` 选择 `content/` **根目录**（工具需同时写 `posts/` 与 `images/`）
- 目录句柄存入 IndexedDB；下次访问自动恢复
- **权限**：恢复句柄后调 `queryPermission({ mode: 'readwrite' })`；权限不足时显示"重新授权"按钮（权限请求必须用户手势触发），引导重新选择目录
- 写文件：`getFileHandle(name, { create: true })` + `createWritable()`
- 编辑中未保存更改：脏状态检测 + `beforeunload` 关闭确认

## 4. 功能清单

| 功能 | 说明 |
|---|---|
| 文章列表 | 列出 `content/posts/` 现有 md（标题/日期/分类/标签），点击进入编辑；无句柄时显示选择目录引导 |
| 新建 | 标题 → 自动生成 slug（可编辑，中文保留，规则与构建脚本一致）→ 文件名 `YYYY-MM-DD-slug.md` |
| 编辑已有 | 解析现有 frontmatter 填充表单；**slug 只读**（文件名主体），保存保持原文件名 |
| 元数据表单 | 标题、日期（默认今天）、分类（下拉已有 + 可新建）、标签（多选已有 + 可新建）、jpChar、摘要（自动截取 + 可编辑） |
| 封面 | 选图/粘贴图片 → 自动复制到 `content/images/`（重名加 `-1` 后缀）→ 写 `coverImage: /images/xxx.jpg` → 卡片预览 |
| 正文 | Markdown textarea + 实时预览（ArticleBody）；工具栏"插入图片"：选图/粘贴 → 复制到 images → 光标处插入 `![alt](/images/xxx.jpg)`（alt = 文件名去扩展名） |
| 导入 md | 打开 .md 文件 → 解析 frontmatter 填充表单 + 正文载入；**未知字段保留**（保存时合并，不丢自定义字段） |
| 保存 | 生成 frontmatter（title/category/tags/coverImage/excerpt/jpChar，date 不写——文件名已有日期）写入 `content/posts/`；同名文件提示覆盖 |

**frontmatter 解析器**：手写轻量解析（`utils/frontmatter.js`），支持单行 `key: value`、内联数组 `tags: [a, b]`、注释行；解析器保留未知字段原文。**slugify 为共享模块 `utils/slugify.js`**，构建脚本 `client/scripts/build-content.mjs` 与前端工具共同 import（单一来源，防漂移）。

## 5. 文件结构

```
client/src/
├── pages/WriterPage.jsx              # 主页面（布局/状态编排/句柄管理）
├── components/writer/
│   ├── WriterMetaForm.jsx            # 元数据表单（标题/分类/标签/封面/摘要/jpChar）
│   ├── WriterPreview.jsx             # markdown 预览（ArticleBody）+ PostCard 卡片预览
│   └── WriterToolbar.jsx             # 正文工具栏（插入图片/导入 md）
├── utils/frontmatter.js              # frontmatter 解析/生成（保留未知字段）
├── utils/slugify.js                  # 共享 slug 规则（构建脚本与工具共用）
└── utils/file-system.js              # 目录句柄：IndexedDB 持久化/权限/读写/复制图片
```

组件规模约束（coding.md）：WriterPage ≤250 行，超限时拆子组件。

## 6. 粘贴图片实现

监听 paste 事件读取 `e.clipboardData.items` 中的 image 类型（无需 clipboard-read 权限），保存为 `content/images/粘贴时间戳.png`（或原文件名），插入引用。

## 7. 验证方式

- 语法检查：node --check（js 文件）
- 构建脚本回归：`npm run build` 后数据仍正确生成
- File System Access 依赖浏览器交互，沙箱无法验证——用户本机 Chrome 实测：新建/编辑/保存/导入/插图片/封面/预览全流程

## 8. 已知限制

- 仅 Chromium；Firefox/Safari 显示引导
- 保存后仍需 `npm run build` + deploy 才能上线（工具职责 = 编辑 content 文件）
- 线上访问 `/writer`（https 下 File System Access 可用）写入的是用户本地文件夹
- 正文为 Markdown 文本编辑（不重引入已删除的 BlockNote）

## 9. 范围外（明确不做）

- 图片压缩/缩放（原图复制）
- 自动部署（CI）
- 多用户/云端同步
- 移动端优化（File System Access 桌面为主）
