function slugify(text) {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) slug = 'untitled'

  return slug
}

async function uniqueSlug(prisma, model, text, suffix = 0) {
  const base = slugify(text)
  const slug = suffix ? `${base}-${suffix}` : base
  const existing = await prisma[model].findUnique({ where: { slug } })
  if (existing) return uniqueSlug(prisma, model, text, suffix + 1)
  return slug
}

module.exports = { slugify, uniqueSlug }
