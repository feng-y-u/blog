# 写作工具封面优化设计（延迟复制 + 焦点调整）

日期：2026-08-26
状态：待用户审阅

## 1. 背景与目标

/`writer` 写作工具当前有两个封面相关的体验问题：

1. **选封面即落盘**：`onPickCover` 选中文件就调用 `copyImageTo()` 把图片写入 `content/images/`；即使随后「移除」封面、换图或放弃保存，文件也已留在磁盘上，产生未使用的孤儿图。
2. **封面显示位置不可控**：封面图在卡片、文章头图、杂志封面、搜索缩略图等处统一 `object-fit: cover` 居中裁切，无法指定显示焦点，经常展示不重要的部分。

目标：

- 图片只在「保存且确实使用」时才进入 `content/images/`；换封面保存时清理旧封面文件。
- 支持为每篇文章设置封面显示焦点（拖拽 + 预设），全站封面渲染统一生效。

## 2. ① 封面延迟复制 + 换封面删旧文件

### 选择封面（`WriterPage.onPickCover`）

- 不再执行 `copyImageTo`。
- 改为：`const blob = await compressImage(f)` → `URL.createObjectURL(blob)` 作为临时预览地址写入 `coverImage`，同时把 Blob 存入新表单字段 `coverFile`。
- 预览链路无需改动：`useResolvedUrl` 对非 `/images/` URL 原样返回，blob URL 直接可用。

### 保存（`useWriterArticle.handleSave`）

- 若 `form.coverFile` 存在：
  - `const newUrl = await copyImageTo(dir, form.coverFile)`，frontmatter 里写入 `newUrl`。
  - 若本次为**替换封面**（旧 `form.extra.coverImage` 为 `/images/...` 且与 `newUrl` 不同）：保存成功后删除旧文件，但删除前检查**是否被其他文章引用**（复用「本文章片」的检查逻辑，提取为公共函数）——被引用则保留并提示。
- 若 `coverFile` 不存在：`coverImage` 沿用表单当前值（已有文章的原始 `/images/...` URL）。
- 保存成功后：`URL.revokeObjectURL` 撤销临时地址、清空 `coverFile`。

### 移除封面

- 「移除」按钮仅清空 `coverImage` 与 `coverFile`，**不删除磁盘文件**（已确认：非破坏性，需要删时用「本文章片」）。

### 覆盖场景

| 场景 | 行为 |
|---|---|
| 新建文章选封面后从不保存 | 文件不进入 content/ |
| 选封面后点「移除」 | 文件不进入 content/ |
| 先选 A 再选 B，保存 | 只复制 B |
| 已保存文章：选 A 保存 → 选 B 保存 | 复制 B；A 未被其他文章引用则删除 |
| 已保存文章：移除封面并保存 | 字段删除，文件保留 |
| 只改标题不动封面，保存 | 不复制、不删除 |

## 3. ② 封面显示焦点（拖拽 + 预设）

### 数据链路

- frontmatter 新增 `coverPosition`：CSS `object-position` 值（如 `50% 30%`、`top`）。解析器/生成器已透传未知字段，无需改动。
- `client/scripts/build-content.mjs`：posts 数据增加 `coverPosition: data.coverPosition || null`。
- 渲染处为封面 `<img>` 增加 `style={{ objectPosition: post.coverPosition }}`（空值不设，保持默认居中）：
  - `PostCard`（列表卡片 `.post-card-cover img`）
  - `PostDetailPage` 文章头图（`.article-hero`）
  - `MagazineSpread` 杂志封面（内联 `objectFit: cover` 的 img）
  - `SearchResults` 搜索结果缩略图（实现时确认其渲染对象来自 posts 数据；如未携带该字段则在构建结果中补充）
- 保存时：`coverPosition` 有值则写入 frontmatter（写入顺序跟随现有 keys 数组），无值则不写。

### 写作工具 UI（新组件 `CoverFocalPicker.jsx`）

- 独立文件，遵守 coding.md 组件 ≤250 行。
- 位置：`WriterMetaForm` 封面字段下方，有封面时显示。
- 形态：按卡片比例（480×180）的裁切预览框（`object-fit: cover` + 当前 `objectPosition`，所见即所得）
  - 覆盖可拖动/可点按的十字准星，实时换算成百分比的 `object-position`
  - 预设按钮：顶部 / 居中 / 底部
  - 当前坐标文本 + 「重置」按钮（恢复 `50% 50%`）
- 结果经 `onField('coverPosition', …)` 写入表单，`WriterMetaForm` 的 PostCard 预览同步反映。
- **换封面时焦点重置为居中**（已确认：旧焦点针对旧图，换图后重新调整）：`onPickCover` 成功时顺带清空 `coverPosition`。

## 4. 文件结构

```
client/src/
├── utils/file-system.js                 # + 提取「图片是否被其他文章引用」公共函数
├── components/writer/
│   ├── CoverFocalPicker.jsx             # 新增：封面焦点调整器（拖拽 + 预设）
│   ├── WriterMetaForm.jsx               # 封面字段下挂载 CoverFocalPicker
│   ├── WriterPage.jsx                   # onPickCover 改为延迟复制（blob 预览）
│   └── useWriterArticle.js              # form 增加 coverFile；handleSave 复制/删旧
├── components/PostCard.jsx              # + objectPosition
├── pages/PostDetailPage.jsx             # + objectPosition
├── components/MagazineSpread.jsx        # + objectPosition
├── components/SearchResults.jsx         # + objectPosition（确认数据携带后）
└── styles/（无需改动，object-position 走内联样式）
```

## 5. 错误处理与边界

- 图片复制失败：`handleSave` 中止并 toast 保存失败；不写 frontmatter。
- 删除旧封面文件失败：不影响新封面写入；仅 toast 提示。
- 旧文件被其他文章引用：保留文件并 toast 说明（与「本文章片」一致）。
- blob URL 生命周期：换图时撤销旧 blob URL，避免内存泄漏；保存成功后撤销。
- `coverFile` 随表单状态走：切文章/新建时随 `setCurrent` 重置，不会串图。

## 6. 不做的事（YAGNI）

- 不做正文插图延迟复制（正文插图选中即插入引用，属于"已使用"，维持现状）。
- 不做封面裁切框（crop box）或比例选择，仅调整显示焦点。
- 不做焦点调整的全局默认值配置（默认即居中，与现状一致）。