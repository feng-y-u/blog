const { Feed } = require('feed')
const prisma = require('../utils/prisma')

async function rss(req, res, next) {
  try {
    const siteUrl = req.protocol + '://' + req.get('host')

    const feed = new Feed({
      title: "Yuki's Blog",
      description: '代码与动漫的世界',
      id: siteUrl,
      link: siteUrl,
      language: 'zh-CN',
      updated: new Date(),
    })

    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      include: { category: true, author: true },
    })

    posts.forEach(post => {
      feed.addItem({
        title: post.title,
        id: `${siteUrl}/post/${post.slug}`,
        link: `${siteUrl}/post/${post.slug}`,
        description: post.excerpt || '',
        content: post.content,
        author: [{ name: post.author.displayName || post.author.username }],
        category: post.category ? [{ name: post.category.name }] : [],
        date: post.publishedAt || post.createdAt,
      })
    })

    res.set('Content-Type', 'application/rss+xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(feed.rss2())
  } catch (err) {
    next(err)
  }
}

module.exports = { rss }
