import { readdir, readFile, mkdir, copyFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')
const contentDir = path.join(root, 'content')
const publicDir = path.join(root, 'client/public')

// Same rules as the old server slugify (keeps CJK).
function slugify(text) {
  let slug = String(text).toLowerCase().trim()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'untitled'
}

function parseDateFromFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})[-_]/)
  return m ? m[1] : null
}

async function loadMarkdownFiles(dir) {
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter(f => f.isFile() && f.name.endsWith('.md'))
    .sort()
  const items = []
  for (const f of files) {
    const raw = await readFile(path.join(dir, f.name), 'utf-8')
    const { data, content } = matter(raw)
    const base = f.name.replace(/\.md$/, '')
    const datePrefix = parseDateFromFilename(base)
    const slug = datePrefix ? base.slice(datePrefix.length + 1) : base
    const title = data.title || content.match(/^#\s+(.+)$/m)?.[1]?.trim() || slug
    const fileStat = await stat(path.join(dir, f.name))
    const date = datePrefix || data.date || fileStat.mtime.toISOString().slice(0, 10)
    items.push({ slug, title, date, data, content })
  }
  return items
}

// --- build posts ---
const postFiles = await loadMarkdownFiles(path.join(contentDir, 'posts'))
const categoryNames = new Set()
const tagNames = new Set()
const seenSlugs = new Set()
const posts = postFiles.map(({ slug, title, date, data, content }) => {
  if (seenSlugs.has(slug)) throw new Error(`重复的 slug: ${slug}`)
  seenSlugs.add(slug)
  const categoryName = data.category || null
  if (categoryName) categoryNames.add(categoryName)
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : []
  tags.forEach(t => tagNames.add(t))
  return {
    slug,
    title,
    publishedAt: new Date(date + 'T00:00:00Z').toISOString(),
    category: categoryName ? { name: categoryName, slug: slugify(categoryName) } : null,
    tags: tags.map(t => ({ name: t, slug: slugify(t) })),
    coverImage: data.coverImage || data.cover || null,
    excerpt: data.excerpt || content.replace(/^#\s+.+$/m, '').replace(/[#*`\[\]()>|\\-]/g, '').trim().slice(0, 120),
    jpChar: data.jpChar || null,
    content,
    viewCount: 0,
  }
}).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

const categories = [...categoryNames].map(name => ({
  name,
  slug: slugify(name),
  description: null,
  _count: { posts: posts.filter(p => p.category?.name === name).length },
}))

const tags = [...tagNames].map(name => ({
  name,
  slug: slugify(name),
  _count: { posts: posts.filter(p => p.tags?.some(t => t.name === name)).length },
}))

// --- build notes ---
const noteFiles = await loadMarkdownFiles(path.join(contentDir, 'notes'))
const seenNoteSlugs = new Set()
const notes = noteFiles.map(({ slug, title, date, data, content }) => {
  if (seenNoteSlugs.has(slug)) throw new Error(`重复的笔记 slug: ${slug}`)
  seenNoteSlugs.add(slug)
  const categoryName = data.category || null
  return {
    slug,
    title,
    updatedAt: new Date(date + 'T00:00:00Z').toISOString(),
    category: categoryName ? { name: categoryName, slug: slugify(categoryName) } : null,
    content,
  }
}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

// --- settings ---
let settings = {}
try {
  settings = JSON.parse(await readFile(path.join(contentDir, 'config.json'), 'utf-8'))
} catch (e) {
  console.warn('config.json 缺失或非法，使用空设置')
}

// --- write outputs ---
await mkdir(path.join(publicDir, 'data'), { recursive: true })
await writeFile(path.join(publicDir, 'data/posts.json'), JSON.stringify(posts))
await writeFile(path.join(publicDir, 'data/notes.json'), JSON.stringify(notes))
await writeFile(path.join(publicDir, 'data/categories.json'), JSON.stringify(categories))
await writeFile(path.join(publicDir, 'data/tags.json'), JSON.stringify(tags))
await writeFile(path.join(publicDir, 'data/settings.json'), JSON.stringify(settings))

// --- copy images ---
await mkdir(path.join(publicDir, 'images'), { recursive: true })
const imagesSrc = path.join(contentDir, 'images')
try {
  const files = await readdir(imagesSrc, { withFileTypes: true })
  for (const f of files) {
    if (f.isFile()) await copyFile(path.join(imagesSrc, f.name), path.join(publicDir, 'images', f.name))
  }
} catch { /* no images dir, skip */ }

// --- sitemap + robots ---
const siteUrl = settings.site_url || 'https://example.com'
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sm += `  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>\n`
for (const p of posts) sm += `  <url><loc>${siteUrl}/post/${p.slug}</loc><lastmod>${p.publishedAt.slice(0, 10)}</lastmod><priority>0.9</priority></url>\n`
for (const c of categories) sm += `  <url><loc>${siteUrl}/category/${c.slug}</loc><priority>0.8</priority></url>\n`
for (const t of tags) sm += `  <url><loc>${siteUrl}/tag/${t.slug}</loc><priority>0.7</priority></url>\n`
sm += `  <url><loc>${siteUrl}/notes</loc><priority>0.7</priority></url>\n</urlset>`
await writeFile(path.join(publicDir, 'sitemap.xml'), sm)
await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)

console.log(`✔ posts: ${posts.length}, notes: ${notes.length}, categories: ${categories.length}, tags: ${tags.length}`)
