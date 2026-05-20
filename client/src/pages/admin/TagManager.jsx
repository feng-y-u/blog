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
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-3">{editing ? '编辑标签' : '新增标签'}</h2>
        <div className="flex gap-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="标签名称" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" />
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? '更新' : '创建'}</button>
          {editing && <button onClick={() => { setEditing(null); setName('') }} className="px-4 py-2 border rounded">取消</button>}
        </div>
      </div>
      <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left p-3">名称</th>
            <th className="text-left p-3">Slug</th>
            <th className="text-left p-3">文章数</th>
            <th className="text-left p-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {tags.map(tag => (
            <tr key={tag.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="p-3">{tag.name}</td>
              <td className="p-3 text-sm text-gray-500">{tag.slug}</td>
              <td className="p-3 text-sm">{tag._count?.posts || 0}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => { setEditing(tag.id); setName(tag.name) }} className="text-sm text-green-600 hover:underline">编辑</button>
                <button onClick={() => handleDelete(tag.id)} className="text-sm text-red-600 hover:underline">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
