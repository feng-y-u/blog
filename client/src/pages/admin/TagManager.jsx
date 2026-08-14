import { useState, useEffect } from 'react'
import { getTags, createTag, updateTag, deleteTag } from '../../api/tags'
import AdminToast from '../../components/AdminToast'
import ConfirmModal from '../../components/ConfirmModal'
import Loading from '../../components/Loading'

export default function TagManager() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  function load() {
    setLoading(true)
    getTags().then(res => setTags(res.data.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave() {
    try {
      if (editing) {
        await updateTag(editing, { name })
        setToast({ type: 'success', text: '已更新' })
      } else {
        await createTag({ name })
        setToast({ type: 'success', text: '已创建' })
      }
      setName(''); setEditing(null)
      load()
    } catch { setToast({ type: 'error', text: '操作失败' }) }
  }

  async function handleDelete(id) {
    setConfirmDelete({ id })
  }

  if (loading) return <Loading />

  return (
    <div>
      <AdminToast message={toast?.text} type={toast?.type} onClose={() => setToast(null)} />
      <div className="admin-page-header">
        <h1 className="admin-page-title">标签管理</h1>
      </div>
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
                <td>
                  <div className="admin-actions">
                    <button onClick={() => { setEditing(tag.id); setName(tag.name) }} className="admin-action-edit">编辑</button>
                    <button onClick={() => handleDelete(tag.id)} className="admin-action-delete">删除</button>
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
        message="确定删除此标签？"
        confirmText="删除"
        danger
        onConfirm={async () => {
          try {
            await deleteTag(confirmDelete.id)
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
