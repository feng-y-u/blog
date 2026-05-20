import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostBySlug, createPost, updatePost, getCategories, getTags } from '../../api/posts'

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([catRes, tagRes]) => {
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getPostBySlug(id).then(res => {
      const post = res.data.data
      setTitle(post.title)
      setContent(post.content)
      setExcerpt(post.excerpt || '')
      setCoverImage(post.coverImage || '')
      setCategoryId(post.categoryId || '')
      setSelectedTags(post.tags?.map(t => t.id) || [])
    })
  }, [id, isEdit])

  async function handleSave(status) {
    const data = { title, content, excerpt, coverImage, status, categoryId: categoryId || null, tagIds: selectedTags }
    try {
      if (isEdit) {
        await updatePost(id, data)
      } else {
        await createPost(data)
      }
      navigate('/admin/posts')
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message))
    }
  }

  function toggleTag(tagId) {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? '编辑文章' : '写文章'}</h1>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <div className="flex-1 flex flex-col gap-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-lg font-semibold" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="正文（Markdown）" className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm bg-white dark:bg-gray-800 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => handleSave('draft')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">保存草稿</button>
            <button onClick={() => handleSave('published')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">发布</button>
          </div>
        </div>
        <div className="w-80 flex flex-col gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800">
            <label className="block text-sm font-medium mb-1">分类</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
              <option value="">无分类</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800">
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2 py-1 rounded-full ${selectedTags.includes(tag.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{tag.name}</button>
              ))}
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 bg-white dark:bg-gray-800">
            <label className="block text-sm font-medium mb-1">封面图 URL</label>
            <input type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
