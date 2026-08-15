import { useRef } from 'react'

export default function WriterToolbar({ onImportMd, onInsertImage, onSave, dirty, saving }) {
  const mdRef = useRef(null)
  const imgRef = useRef(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
      <button className="writer-btn" onClick={() => mdRef.current?.click()}>导入 .md</button>
      <button className="writer-btn" onClick={() => imgRef.current?.click()}>插入图片</button>
      <input ref={mdRef} type="file" accept=".md" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onImportMd(f); e.target.value = '' }} />
      <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onInsertImage(f); e.target.value = '' }} />
      <span style={{ flex: 1 }} />
      {dirty && <span style={{ fontSize: '12px', color: 'var(--accent-pink)' }}>● 未保存</span>}
      <button className="writer-btn" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }} onClick={onSave} disabled={saving}>
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
