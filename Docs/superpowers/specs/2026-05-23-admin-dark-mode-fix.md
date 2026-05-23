# 管理后台暗色模式修复

## 问题

项目使用 `data-theme` 属性控制主题（`data-theme="dark"` / `data-theme="light"`），但 Tailwind 配置的暗色模式策略为 `darkMode: 'class'`。这导致管理后台所有 `dark:` Tailwind 工具类（如 `dark:bg-gray-800`、`dark:border-gray-700`）无法生效。切换到暗色模式时，管理后台各页面颜色显示错误。

## 涉及范围

- **tailwind.config.js** — 暗色模式策略需要扩展，同时支持 `class` 和 `[data-theme="dark"]`
- **AdminLayout.jsx** — 侧边栏在暗色模式下颜色异常
- **PostManager, CategoryManager, TagManager, CommentManager, NoteManager, AdminDashboard, AppearanceSettings** — 各管理页面的 `dark:` 类需要生效

## 方案

修改 Tailwind 配置，使其同时识别 `class` 和 `data-theme` 两种暗色模式触发方式：

```js
darkMode: ['class', '[data-theme="dark"]']
```

这样当 `<html>` 元素上存在 `data-theme="dark"` 属性时，Tailwind 的 `dark:` 变体就会激活。管理后台现有的 `dark:bg-gray-800` 等类将正确工作，无需逐个修改页面。

管理后台保留当前的 Tailwind 灰色风格，不改为公共页面的暗色赛博朋克主题。两种风格各有不同的阶段，视觉上区分管理区和公共区。

## 验证方式

1. 在公共页面切换主题（暗色/亮色）
2. 进入管理后台，确认背景/边框/文字颜色正确切换
3. 检查所有管理页面在两种主题下均可读
