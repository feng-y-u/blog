import { useState, useEffect } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/posts'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  function load() {
    setLoading(true)
    getCategories().then(res => setCategories(res.data.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      if (editing) {
        await updateCategory(editing, { name, description })
      } else {
        await createCategory({ name, description })
      }
      setName(''); setDescription(''); setEditing(null)
      load()
    } catch (err) { alert('操作失败') }
  }

  function handleEdit(cat) {
    setEditing(cat.id)
    setName(cat.name)
    setDescription(cat.description || '')
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    await deleteCategory(id)
    load()
  }

  return (
    <div>
      <h1 className="admin-page-title">分类管理</h1>
      <div className="admin-card">
        <h2 className="admin-card-title">{editing ? '编辑分类' : '新增分类'}</h2>
        <div className="admin-form-row">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="分类名称" className="admin-input admin-input-flex" />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="描述（可选）" className="admin-input admin-input-flex" />
          <button onClick={handleSave} className="admin-btn admin-btn-primary">{editing ? '更新' : '创建'}</button>
          {editing && <button onClick={() => { setEditing(null); setName(''); setDescription('') }} className="admin-btn">取消</button>}
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>Slug</th>
              <th>描述</th>
              <th>文章数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td style={{ color: 'var(--fg)' }}>{cat.name}</td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{cat.slug}</td>
                <td style={{ fontSize: '13px', color: 'var(--fg-secondary)' }}>{cat.description || '-'}</td>
                <td style={{ fontSize: '13px' }}>{cat._count?.posts || 0}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(cat)} style={{ fontSize: '13px', color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>编辑</button>
                  <button onClick={() => handleDelete(cat.id)} style={{ fontSize: '13px', color: 'var(--accent-pink)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
