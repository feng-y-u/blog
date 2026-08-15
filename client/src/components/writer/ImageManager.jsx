import { useState, useEffect } from 'react'
import { listImageFiles, deleteImage, listMarkdownFiles, readTextFile } from '../../utils/file-system'
import { parseFrontmatter } from '../../utils/frontmatter'

// Image manager modal: lists content/images/, shows which files are referenced
// by posts, and allows deleting unreferenced or confirmed files.
export default function ImageManager({ open, dir, onClose }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const names = await listImageFiles(dir)
      const used = new Set()
      const postsDir = await dir.getDirectoryHandle('posts')
      for (const name of await listMarkdownFiles(postsDir)) {
        const raw = await readTextFile(postsDir, name)
        const { data } = parseFrontmatter(raw)
        for (const m of raw.matchAll(/\/images\/([^)\s"'`]+)/g)) {
          used.add(decodeURIComponent(m[1]))
        }
        if (data.coverImage) {
          const m = String(data.coverImage).match(/\/images\/([^)\s"'`]+)/)
          if (m) used.add(decodeURIComponent(m[1]))
        }
      }
      setImages(names.map(name => ({ name, referenced: used.has(name) })))
    } catch (err) {
      setError('加载图片失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && dir) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dir])

  if (!open) return null

  async function handleDelete(name) {
    if (!window.confirm(`确定删除图片 ${name}？此操作不可撤销。`)) return
    try {
      await deleteImage(dir, name)
      setImages(prev => prev.filter(i => i.name !== name))
    } catch (err) {
      setError('删除失败: ' + err.message)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: 'min(720px, 92vw)', maxHeight: '80vh', overflowY: 'auto',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: 0 }}>图片管理（content/images/）</h2>
          <span style={{ flex: 1 }} />
          <button className="writer-btn" onClick={onClose}>关闭</button>
        </div>
        {error && <p style={{ color: 'var(--accent-pink)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
        {loading ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '13px' }}>加载中…</p>
        ) : images.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '13px' }}>暂无图片</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {images.map(img => (
              <div key={img.name} style={{
                border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)',
              }}>
                <img src={`/images/${encodeURIComponent(img.name)}`} alt={img.name}
                  style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block', background: 'var(--bg)' }} />
                <div style={{ padding: '8px' }}>
                  <div style={{
                    fontSize: '11px', color: 'var(--fg-secondary)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px',
                  }} title={img.name}>{img.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                      background: img.referenced ? 'var(--accent-dim)' : 'var(--surface)',
                      color: img.referenced ? 'var(--accent)' : 'var(--fg-muted)',
                    }}>
                      {img.referenced ? '被引用' : '未引用'}
                    </span>
                    <span style={{ flex: 1 }} />
                    <button
                      style={{
                        fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer',
                        color: img.referenced ? 'var(--fg-muted)' : 'var(--accent-pink)',
                      }}
                      disabled={img.referenced}
                      title={img.referenced ? '该图片被文章引用，先删除正文引用后再删' : '删除图片文件'}
                      onClick={() => handleDelete(img.name)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
