import { useState } from 'react'
import { deleteImage, listMarkdownFiles, readTextFile, revokeImageUrl } from '../../utils/file-system'
import useResolvedUrl from './useResolvedUrl'

// Extract /images/ references from the current article's content + coverImage.
function extractImageRefs(content, coverImage) {
  const refs = new Map()
  for (const m of String(content || '').matchAll(/!\[[^\]]*\]\(\s*\/images\/([^)\s"'`]+)[^)]*\)/g)) {
    const name = decodeURIComponent(m[1])
    refs.set(name, { count: (refs.get(name)?.count || 0) + 1, isCover: false })
  }
  const cm = String(coverImage || '').match(/\/images\/([^)\s"'`]+)/)
  if (cm) {
    const name = decodeURIComponent(cm[1])
    refs.set(name, { count: refs.get(name)?.count || 0, isCover: true })
  }
  return [...refs.entries()].map(([name, v]) => ({ name, ...v }))
}

// Thumbnail of one image file, resolved against the connected content dir.
function Thumb({ dir, name }) {
  const src = useResolvedUrl(dir, `/images/${encodeURIComponent(name)}`)
  return <img src={src} alt={name}
    style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, background: 'var(--bg)' }} />
}

// Article-scoped image manager: shows only images referenced by the article
// being edited, tagged as cover/inline, and removes them with one click
// (clears references + deletes the file unless other posts still use it).
export default function ImageManager({ open, dir, form, onChange, onClose }) {
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(null)

  if (!open) return null

  const images = extractImageRefs(form.content, form.coverImage)

  async function handleRemove(name, isCover) {
    setBusy(name)
    setNotice(null)
    try {
      // 1. strip all markdown image references to this file from the content
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`!\\[[^\\]]*\\]\\([^)]*\\/images\\/${escaped}[^)]*\\)`, 'g')
      const nextContent = String(form.content || '').replace(re, '')
      // 2. clear the cover field if it points at this image
      if (isCover) onChange('coverImage', '')
      if (nextContent !== form.content) onChange('content', nextContent)

      // 3. delete the file unless another post (on disk, excluding this one)
      //    still references it
      const postsDir = await dir.getDirectoryHandle('posts')
      let usedElsewhere = false
      for (const pname of await listMarkdownFiles(postsDir)) {
        if (pname === form.name) continue
        const raw = await readTextFile(postsDir, pname)
        if (raw.includes(`/images/${name}`)) { usedElsewhere = true; break }
      }
      if (usedElsewhere) {
        setNotice(`「${name}」仍被其他文章引用，已移除本文引用但保留文件`)
      } else {
        await deleteImage(dir, name)
        revokeImageUrl(name)
        setNotice(`已移除引用并删除文件「${name}」`)
      }
    } catch (err) {
      setNotice('操作失败: ' + err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: 'min(640px, 92vw)', maxHeight: '80vh', overflowY: 'auto',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0 }}>本文章片</h2>
          <span style={{ flex: 1 }} />
          <button className="writer-btn" onClick={onClose}>关闭</button>
        </div>
        {notice && (
          <p style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '12px', background: 'var(--accent-dim)', borderRadius: '6px', padding: '8px 12px' }}>{notice}</p>
        )}
        {images.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '13px' }}>本文暂无图片（正文或封面）</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {images.map(img => (
              <div key={img.name} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                border: '1px solid var(--border)', borderRadius: '8px',
                padding: '8px 12px', background: 'var(--surface)',
              }}>
                <Thumb dir={dir} name={img.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={img.name}>
                    {img.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {img.isCover && (
                      <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: 'var(--accent-dim)', color: 'var(--accent)' }}>封面图</span>
                    )}
                    {img.count > 0 && (
                      <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: '999px', background: 'var(--surface)', color: 'var(--fg-secondary)' }}>
                        正文 ×{img.count}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="writer-btn"
                  disabled={busy === img.name}
                  onClick={() => handleRemove(img.name, img.isCover)}
                  title="移除本文引用并删除文件（若未被其他文章引用）"
                >
                  {busy === img.name ? '处理中…' : '移除'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
