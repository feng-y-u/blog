const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@blog.local',
      passwordHash: adminPassword,
      displayName: '管理员',
    },
  })

  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: '技术' }, update: {}, create: { name: '技术', slug: 'tech', description: '技术相关文章' } }),
    prisma.category.upsert({ where: { name: '生活' }, update: {}, create: { name: '生活', slug: 'life', description: '生活随笔' } }),
    prisma.category.upsert({ where: { name: '笔记' }, update: {}, create: { name: '笔记', slug: 'note', description: '学习笔记' } }),
  ])

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: 'JavaScript' }, update: {}, create: { name: 'JavaScript', slug: 'javascript' } }),
    prisma.tag.upsert({ where: { name: 'React' }, update: {}, create: { name: 'React', slug: 'react' } }),
    prisma.tag.upsert({ where: { name: 'Node.js' }, update: {}, create: { name: 'Node.js', slug: 'nodejs' } }),
    prisma.tag.upsert({ where: { name: 'CSS' }, update: {}, create: { name: 'CSS', slug: 'css' } }),
    prisma.tag.upsert({ where: { name: '随笔' }, update: {}, create: { name: '随笔', slug: 'essay' } }),
  ])

  const defaultSettings = [
    { key: 'site_title', value: '✦ 风予\'s Blog' },
    { key: 'site_subtitle', value: 'コードとアニメの世界' },
    { key: 'banner_image', value: '' },
    { key: 'avatar_emoji', value: '🌸' },
    { key: 'profile_name', value: '风予' },
    { key: 'social_links', value: JSON.stringify({ github: 'https://github.com/feng-y-u', bilibili: 'https://space.bilibili.com/635562556' }) },
  ]
  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s })
  }

  console.log('Seed completed:', { admin: admin.username, categories: categories.length, tags: tags.length, settings: defaultSettings.length })
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
