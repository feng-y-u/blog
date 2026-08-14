import { useState, useEffect } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/posts'
import AdminToast from '../../components/AdminToast'
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function load() {
    setLoading(true)
    getCategories().then(res => setCategories(res.data.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      if (editing) {
        await updateCategory(editing, { name, description })
        setToast({ type: 'success', text: '已更新' })
      } else {
        await createCategory({ name, description })
        setToast({ type: 'success', text: '已创建' })
      }
      setName(''); setDescription(''); setEditing(null)
      load()
    } catch { setToast({ type: 'error', text: '操作失败' }) }
  }

  function handleEdit(cat) {
    setEditing(cat.id)
    setName(cat.name)
    setDescription(cat.description || '')
  }

  async function handleDelete(id) {
    setConfirmDelete({ id })
  }

  if (loading) return <Loading />

  return (
    <div>
      <AdminToast message={toast?.text} type={toast?.type} onClose={() => setToast(null)} />
      <div className="admin-page-header">
        <h1 className="admin-page-title">分类管理</h1>
      </div>
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
                <td>
                  <div className="admin-actions">
                    <button onClick={() => handleEdit(cat)} className="admin-action-edit">编辑</button>
                    <button onClick={() => handleDelete(cat.id)} className="admin-action-delete">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={!!confirmDelete}
        title="确认删除"
        message="确定删除此分类？相关文章将变为未分类。"
        confirmText="删除"
        danger
        onConfirm={async () => {
          try {
            await deleteCategory(confirmDelete.id)
            setToast({ type: 'success', text: '已删除' })
            load()
          } catch { setToast({ type: 'error', text: '删除失败' }) }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
