# 首页 Splash 下雪效果设计

## 概述

在首页 splash 大图（glow.jpg）上层叠加 Canvas 2D 粒子下雪效果，下滑时随 clip-path 一起自然消失，增强首页的沉浸氛围。

## 参数

| 参数 | 值 |
|------|-----|
| 范围 | 仅限 splash 大图区域 |
| 实现 | Canvas 2D 粒子系统 |
| 粒子数 | ~60 |
| 大小 | 1~6px 白色圆形，随机 |
| 透明度 | 0.3~0.9 随机 |
| 下落速度 | 0.3~0.8 px/frame（约 2~5s 落屏） |
| 水平飘移 | 大粒子 ±30px 摆动，小粒子基本垂直 |
| 颜色 | `rgba(255, 255, 255, opacity)` |
| 消失方式 | clip-path 裁切 + opacity 整体渐隐 |

## DOM 结构

Splash 容器内元素层级（从上到下）：

```
.home-splash (position: relative, overflow: hidden)
├── <img .splash-bg>
├── <div .splash-overlay>
├── <canvas .snow-canvas>     ← 新增
├── <div .splash-content>
└── <div .splash-scroll-hint>
```

Canvas 属性：`pointer-events: none`、`position: absolute`、`inset: 0`。

## 组件设计

### SnowEffect.jsx（新建）

- 全屏 `<canvas>` 覆盖在 splash-overlay 之上、splash-content 之下
- 接收 `progress` prop（0~1，来自 GSAP ScrollTrigger）
- 60 个粒子对象，每个维护 x, y, size, speed, opacity, drift
- requestAnimationFrame 驱动更新循环
- 粒子超出底部后重置到顶部随机 x
- canvas 容器的 `opacity = 1 - progress`（整体淡出）
- Canvas 在 splash 容器内，clip-path 自动裁剪

### HomeSplash.jsx（修改）

- 在 splash-overlay 与 splash-content 之间插入 `<SnowEffect />`
- 将 GSAP ScrollTrigger 的 progress 值传递给 SnowEffect
- 在 GSAP onUpdate 回调中：`snowProgress = self.progress`

## 文件改动

1. **新建** `client/src/components/SnowEffect.jsx`
2. **修改** `client/src/components/HomeSplash.jsx` — 引入 SnowEffect，传递 progress
3. **无 CSS 改动**

## 不涉及

- 后端、数据库、路由均无变更
- 不影响其他页面
- 不影响现有 splash clip-path 动画
