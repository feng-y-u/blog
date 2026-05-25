import { useState, useEffect } from 'react'
import { getTags, createTag, updateTag, deleteTag } from '../../api/posts'

export default function TagManager() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')

  function load() {
    setLoading(true)
    getTags().then(res => setTags(res.data.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      if (editing) await updateTag(editing, { name })
      else await createTag({ name })
      setName(''); setEditing(null)
      load()
    } catch (err) { alert('操作失败') }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    await deleteTag(id)
    load()
  }

  return (
    <div>
      <h1 className="admin-page-title">标签管理</h1>
      <div className="admin-card">
        <h2 className="admin-card-title">{editing ? '编辑标签' : '新增标签'}</h2>
        <div className="admin-form-row">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="标签名称" className="admin-input admin-input-flex" />
          <button onClick={handleSave} className="admin-btn admin-btn-primary">{editing ? '更新' : '创建'}</button>
          {editing && <button onClick={() => { setEditing(null); setName('') }} className="admin-btn">取消</button>}
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>Slug</th>
              <th>文章数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map(tag => (
              <tr key={tag.id}>
                <td style={{ color: 'var(--fg)' }}>{tag.name}</td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{tag.slug}</td>
                <td style={{ fontSize: '13px' }}>{tag._count?.posts || 0}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditing(tag.id); setName(tag.name) }} style={{ fontSize: '13px', color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>编辑</button>
                  <button onClick={() => handleDelete(tag.id)} style={{ fontSize: '13px', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
