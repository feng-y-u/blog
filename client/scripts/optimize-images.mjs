// 把 content/images 里的 PNG/JPG 批量转成 WebP，并改写 Markdown / config 里的引用。
//
// 用法：
//   node scripts/optimize-images.mjs            # 转换（原图移到 content/images/_originals/）
//   node scripts/optimize-images.mjs --dry      # 只报告，不写任何文件
//   node scripts/optimize-images.mjs --delete   # 转换后直接删掉原图（不回退目录）
//
// 设计取舍：
// - 只有在 WebP 明显更小（<70%）时才替换，避免把已经压过的小图弄大。
// - 原图默认保留在 content/images/_originals/：构建只拷贝该目录下的“文件”，
//   子目录被跳过，所以不会被打进 dist。
// - 引用改写是纯字符串替换，不做正则，文件名里有中文/括号也不会误伤。

import { readdir, readFile, writeFile, mkdir, rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.resolve(__dirname, '../../content')
const imagesDir = path.join(contentDir, 'images')
const originalsDir = path.join(imagesDir, '_originals')

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const DELETE = args.includes('--delete')
const QUALITY = Number((args.find(a => a.startsWith('--quality=')) || '').split('=')[1] || 82)
const MAX_WIDTH = Number((args.find(a => a.startsWith('--max=')) || '').split('=')[1] || 1600)

const EXT = /\.(png|jpe?g)$/i

function kb(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB'
}

// 收集所有可能引用图片的文本文件
async function collectRefs() {
  const files = [path.join(contentDir, 'config.json')]
  for (const sub of ['posts', 'notes']) {
    const dir = path.join(contentDir, sub)
    try {
      for (const name of await readdir(dir)) {
        if (name.endsWith('.md')) files.push(path.join(dir, name))
      }
    } catch { /* 目录不存在就跳过 */ }
  }
  return files
}

async function main() {
  const names = (await readdir(imagesDir)).filter(n => EXT.test(n))
  if (!names.length) {
    console.log('没有需要处理的图片')
    return
  }

  const converted = []
  let before = 0
  let after = 0

  for (const name of names.sort()) {
    const src = path.join(imagesDir, name)
    const out = src.replace(EXT, '.webp')
    const sizeBefore = (await stat(src)).size
    before += sizeBefore

    let meta
    try {
      meta = await sharp(src).metadata()
    } catch (err) {
      console.log(`跳过 ${name}：读不出图像（${err.message}）`)
      after += sizeBefore
      continue
    }

    if (DRY) {
      console.log(`[dry] ${name}  ${meta.width}x${meta.height}  ${kb(sizeBefore)}`)
      after += sizeBefore
      continue
    }

    await sharp(src)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(out)

    const sizeAfter = (await stat(out)).size
    if (sizeAfter > sizeBefore * 0.7) {
      // 没省多少（或者反而更大）：保留原图，删掉这次的产物
      await unlink(out)
      console.log(`保留 ${name}（${kb(sizeBefore)} → ${kb(sizeAfter)}，收益不足）`)
      after += sizeBefore
      continue
    }

    if (!DELETE) {
      await mkdir(originalsDir, { recursive: true })
      await rename(src, path.join(originalsDir, name))
    } else {
      await unlink(src)
    }

    converted.push({ from: name, to: path.basename(out) })
    after += sizeAfter
    console.log(`${name}  ${kb(sizeBefore)} → ${kb(sizeAfter)}  (${Math.round(sizeAfter / sizeBefore * 100)}%)`)
  }

  if (!DRY && converted.length) {
    const refFiles = await collectRefs()
    let touched = 0
    for (const file of refFiles) {
      let text
      try {
        text = await readFile(file, 'utf8')
      } catch {
        continue
      }
      const original = text
      for (const { from, to } of converted) {
        // 含路径的和裸文件名都替换一次，覆盖 coverImage / ![]() / config 三种写法
        text = text.split(from).join(to)
      }
      if (text !== original) {
        await writeFile(file, text)
        touched++
      }
    }
    console.log(`\n改写引用：${touched} 个文件`)
  }

  if (!DRY) {
    console.log(`\n合计 ${kb(before)} → ${kb(after)}（${converted.length} 张转换）`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
