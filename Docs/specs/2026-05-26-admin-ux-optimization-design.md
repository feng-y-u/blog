# 管理后台 UX 优化设计

## 背景

管理后台存在两个核心问题：（1）文章编辑器纯 Markdown 无实时预览，图片插入流程繁琐；
（2）全局交互体验不一致——危险操作使用 `window.confirm`、错误提示使用 `alert`、
部分页面缺少加载状态。

## 范围

- ✅ 文章编辑器：实时预览 + 上传体验优化
- ✅ 全局体验：确认弹窗、表单验证、加载状态
- ❌ 文章管理搜索/筛选（文章量小，暂时不需要）
- ❌ 评论管理优化（非核心场景）
- ❌ 仪表盘增强（非核心场景）

## 一、文章编辑器重构

### 当前状态

编辑器为单一 textarea + 右侧元数据面板。`react-markdown` / `remark-gfm` /
`rehype-highlight` 已存在于依赖中但未用于编辑预览。图片上传功能已实现（工具栏按钮 →
文件选择 → 插入 `![](url)` 到光标位置），但无拖拽上传。

### 布局

编辑器区域从单列改为左右分栏：

```
┌──────────────────────────────────────────────────────┐
│  [文章标题输入]                                        │
├──────────────────────────┬───────────────────────────┤
│  工具栏: B I H1 | 📷 拖拽上传  |  👁 预览开关          │
├──────────────────────────┤                           │
│  Markdown 编辑区          │  Markdown 实时预览区       │
│  (textarea, 等宽字体)     │  (ReactMarkdown 渲染)      │
│                          │  - 代码高亮               │
│  实时同步滚动             │  - 表格                   │
│                          │  - 图片                   │
│                          │                           │
├──────────────────────────┴───────────────────────────┤
│  [保存草稿]  [发布]                                   │
└──────────────────────────────────────────────────────┘
```

### 关键实现

| 功能 | 方案 | 理由 |
|------|------|------|
| 预览渲染 | 使用已有 `react-markdown` + `remark-gfm` + `rehype-highlight` | 零新依赖，前台文章渲染复用 |
| 分栏方式 | CSS flex 左右各占 50%，可拖拽调整比例（可选） | 空间利用率高，左右对照 |
| 同步滚动 | 编辑区 `onScroll` 按比例映射到预览区 | 编辑时预览区始终对应当前位置 |
| 预览开关 | 工具栏按钮切换预览区显示/隐藏 | 专注写作时可隐藏预览腾空间 |
| 拖拽上传 | 编辑区监听 `onDrop`，拖入图片自动上传并插入 | 简化图片插入流程，提升写作体验 |
| 快捷键 | Ctrl+S 保存草稿 | 常用操作 |

### 涉及文件

- `client/src/pages/admin/PostEditor.jsx` — 主要重构
- `client/src/styles/admin.css` — 新增编辑器分栏/预览样式（如有需要）

## 二、全局体验优化

### 2.1 ConfirmModal 确认弹窗

替代所有 `window.confirm` 调用。组件式设计：

```
┌─────────────────────────────────┐
│  ┌─ 遮罩层 ──────────────────┐  │
│  │  ┌─ 弹窗 ────────────┐   │  │
│  │  │  标题: 确认删除     │   │  │
│  │  │  消息: 此操作不可   │   │  │
│  │  │  撤销，确定继续？   │   │  │
│  │  │                    │   │  │
│  │  │  [取消]  [确认删除] │   │  │
│  │  └────────────────────┘   │  │
│  └────────────────────────────┘  │
└─────────────────────────────────┘
```

**Props**: `open`, `title`, `message`, `confirmText`, `cancelText`, `onConfirm`, `onCancel`, `danger`（确认按钮红色样式）

**使用方式**: 组件式 `<ConfirmModal ... />`，在各管理页面中维护 `showConfirm` state

### 2.2 表单验证（行内错误）

替换 `alert()` 提示：
- NoteManager: 空标题/空内容验证 → 输入框下方红色文字 + 边框变红
- PostEditor: 保存失败/上传失败 → 已有 toast 组件可复用（已实现）

### 2.3 加载状态统一

- 已有 `<Loading />` 组件（三行骨架屏）应用到未使用的页面
- 需要加 Loading 的页面：CategoryManager, TagManager, CommentManager, NoteManager, AdminDashboard
- PostEditor 初始加载类别/标签时也显示 Loading

### 替换清单

| 文件 | 替换内容 |
|------|----------|
| `PostManager.jsx` | `confirm` → `ConfirmModal`（已有 Loading） |
| `CategoryManager.jsx` | `confirm` → `ConfirmModal`，加 Loading |
| `TagManager.jsx` | `confirm` → `ConfirmModal`，加 Loading |
| `CommentManager.jsx` | `confirm` → `ConfirmModal`，加 Loading |
| `NoteManager.jsx` | `confirm` → `ConfirmModal`，`alert` → 行内验证，加 Loading |
| `PostEditor.jsx` | `alert` → toast（已有） |

### 涉及文件

- 新建 `client/src/components/ConfirmModal.jsx`
- 新建 `client/src/styles/confirm-modal.css`（或并入 admin.css）
- 修改 `client/src/pages/admin/*Manager.jsx`（6 个文件）
- 修改 `client/src/pages/admin/PostEditor.jsx`

## 三、非目标（本次不做）

- 文章搜索/状态筛选
- 评论管理审核流程优化
- 仪表盘增强
- 媒体库管理
- 文章访问统计
- 定时发布
- 系统设置扩展
- 键盘快捷键体系（仅保留 Ctrl+S 编辑器保存）
