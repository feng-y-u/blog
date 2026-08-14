# content/images/

文章与站点图片的统一存放目录。构建时（`npm run build` / `npm run dev`）会自动复制到 `client/public/images/`，之后可通过 `/images/文件名` 引用。

## 用途

| 用途 | 配置位置 | 写法 |
|---|---|---|
| 文章封面 | 文章 frontmatter | `coverImage: /images/cover.jpg` |
| 文章正文插图 | Markdown 正文 | `![说明](/images/xxx.png)` |
| 头像图片 | `content/config.json` | `"avatar_image": "/images/avatar.png"`（留空则用 `avatar_emoji` 或默认图） |
| Banner 图片 | `content/config.json` | `"banner_image": "/images/banner.jpg"` |

## 注意

- 也可以直接使用外部图片 URL（如 `https://example.com/x.jpg`），两者都支持
- 文件名建议小写英文/数字/连字符，避免特殊字符
