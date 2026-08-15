# 风予's Blog — 纯静态个人博客

个人博客，分享编程技术与动漫文化。纯静态站点：内容为 Markdown 文件，构建时生成静态数据，部署于 Cloudflare Pages，无需任何后端服务。

## 特性

- 🏠 杂志风首页（跨页翻页 + 粒子/雪花特效）
- 📝 Markdown 写作工具（`/writer` 隐藏路由）：封面/分类/标签可视化设置、图片自动复制、实时预览、导入 md
- 🔍 前端全文搜索（⌘K 快捷键）
- 🌙 暗色模式 / 阅读进度 / 图片灯箱 / 文章目录（左侧导航）
- 📦 归档页 / 关于页 / 分类 / 标签 / 笔记

## 技术栈

React 19 · Vite · react-router-dom · react-markdown · Cloudflare Pages

## 快速开始

```bash
cd client
npm install
npm run dev        # 本地开发（自动构建 content → 静态数据）
npm run build      # 生产构建
npx wrangler pages deploy client/dist   # 部署到 Cloudflare Pages
```

## 写文章

1. 打开 `/writer`（需 Chrome/Edge），选择博客的 `content/` 目录
2. 新建文章：设置标题/分类/标签/封面，粘贴图片自动存入 `content/images/`
3. 保存后自动生成 `content/posts/YYYY-MM-DD-slug.md`（frontmatter 可选，自动推导）
4. 重新 `npm run build` 部署上线

内容结构见 [AGENTS.md](AGENTS.md)。

## 设计参考

本博客的以下设计借鉴了 [Yuki 的博客](https://blog.yuki.sh/)（[源码：xueelf/blog](https://github.com/xueelf/blog)，Hexo + Volantis 主题）：

- 文章页左侧目录导航
- 文章头图（headimg）与卡片式正文
- 归档页（按年份时间线）
- 关于页（博主卡片 + 简介）
- 文章底部版权声明

## License

内容与代码仅作个人用途，转载文章请保留署名（CC BY-NC-SA 4.0）。
