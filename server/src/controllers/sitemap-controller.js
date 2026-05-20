const prisma = require('../utils/prisma')

async function sitemap(req, res, next) {
  try {
    const protocol = req.protocol + '://'
    const host = req.get('host')
    const siteUrl = protocol + host

    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
    })

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`
    xml += `  <url><loc>${siteUrl}/categories</loc><priority>0.8</priority></url>\n`
    xml += `  <url><loc>${siteUrl}/tags</loc><priority>0.8</priority></url>\n`
    xml += `  <url><loc>${siteUrl}/notes</loc><priority>0.7</priority></url>\n`
    posts.forEach(p => {
      const lastmod = p.updatedAt.toISOString().split('T')[0]
      xml += `  <url><loc>${siteUrl}/post/${p.slug}</loc><lastmod>${lastmod}</lastmod><priority>0.9</priority></url>\n`
    })
    xml += '</urlset>'

    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.send(xml)
  } catch (err) {
    next(err)
  }
}

async function robots(req, res) {
  const protocol = req.protocol + '://'
  const host = req.get('host')
  const siteUrl = protocol + host

  res.set('Content-Type', 'text/plain; charset=utf-8')
  res.send(`User-agent: *
Allow: /
Sitemap: ${siteUrl}/api/sitemap
`)
}

module.exports = { sitemap, robots }
