import { useState, useEffect, useRef, useCallback } from 'react'
import { readTextFile, writeTextFile, copyImageTo } from '../../utils/file-system'
import { parseFrontmatter, stringifyFrontmatter } from '../../utils/frontmatter'
import { slugify } from '../../utils/slugify'

const TODAY = new Date().toISOString().slice(0, 10)

function emptyForm() {
  return {
    isNew: true, name: '', slug: '', title: '', date: TODAY,
    category: '', tags: [], jpChar: '', coverImage: '', excerpt: '', content: '',
    extra: {}, order: [],
  }
}

// Editor state for the currently open article: form fields, dirty tracking,
// save/import/image-insert flows. `dir` is the content/ directory handle;
// `onSaved` is called after a successful save so the page can refresh its list.
export default function useWriterArticle(dir, onSaved) {
  const [current, setCurrent] = useState(emptyForm)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const textareaRef = useRef(null)

  // warn before closing with unsaved changes
  useEffect(() => {
    function onBeforeUnload(e) {
      if (dirty) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function onField(key, value) {
    setCurrent(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function handleSelect(name) {
    if (dirty && !window.confirm('当前有未保存的更改，确定放弃并打开其他文章？')) return
    try {
      const postsDir = await dir.getDirectoryHandle('posts')
      const raw = await readTextFile(postsDir, name)
      const { data, order, content } = parseFrontmatter(raw)
      const base = name.replace(/\.md$/, '')
      const datePrefix = base.match(/^(\d{4}-\d{2}-\d{2})[-_]/)?.[1] || ''
      const slug = datePrefix ? base.slice(datePrefix.length + 1) : base
      setCurrent({
        isNew: false, name, slug, title: data.title || '', date: datePrefix || TODAY,
        category: data.category || '', tags: data.tags || [], jpChar: data.jpChar || '',
        coverImage: data.coverImage || '', excerpt: data.excerpt || '', content,
        extra: data, order,
      })
      setDirty(false)
    } catch (err) {
      setToast('打开文章失败: ' + err.message)
    }
  }

  function handleNew() {
    if (dirty && !window.confirm('当前有未保存的更改，确定新建文章？')) return
    setCurrent(emptyForm())
    setDirty(false)
  }

  async function handleImportMd(file) {
    try {
      const text = await file.text()
      const { data, order, content } = parseFrontmatter(text)
      if (dirty && !window.confirm('当前有未保存的更改，确定导入并覆盖编辑器？')) return
      setCurrent({
        isNew: true, name: '', slug: slugify(data.title || file.name.replace(/\.md$/, '')),
        title: data.title || '', date: data.date || TODAY,
        category: data.category || '', tags: data.tags || [], jpChar: data.jpChar || '',
        coverImage: data.coverImage || '', excerpt: data.excerpt || '', content,
        extra: data, order,
      })
      setDirty(true)
    } catch (err) {
      setToast('导入失败: ' + err.message)
    }
  }

  async function handleSave() {
    if (!dir) { setToast('请先打开 content 目录'); return }
    const form = current
    const title = form.title.trim() || form.slug || 'untitled'
    const slug = slugify(form.slug || form.title)
    let name = form.name
    const postsDir = await dir.getDirectoryHandle('posts', { create: true })
    if (form.isNew) {
      const dateSafe = /^\d{4}-\d{2}-\d{2}$/.test(form.date) ? form.date : TODAY
      name = `${dateSafe}-${slug}.md`
      let exists = true
      try {
        await postsDir.getFileHandle(name)
      } catch (err) {
        if (err?.name === 'NotFoundError') exists = false
        else throw err
      }
      if (exists) {
        if (!window.confirm(`文件 ${name} 已存在，覆盖？`)) return
      }
    }
    const data = { ...form.extra, title }
    if (form.category) data.category = form.category; else delete data.category
    if (form.tags.length) data.tags = form.tags; else delete data.tags
    if (form.coverImage) data.coverImage = form.coverImage; else delete data.coverImage
    if (form.excerpt) data.excerpt = form.excerpt; else delete data.excerpt
    if (form.jpChar) data.jpChar = form.jpChar; else delete data.jpChar
    // Note: existing `date` in form.extra stays untouched for edited files;
    // new files omit `date` entirely (the filename prefix carries it).
    const keys = ['title', ...(form.category ? ['category'] : []), ...(form.tags.length ? ['tags'] : []), ...(form.coverImage ? ['coverImage'] : []), ...(form.excerpt ? ['excerpt'] : []), ...(form.jpChar ? ['jpChar'] : [])]
    const order = form.isNew ? keys : [...new Set([...form.order, ...keys])]
    const text = stringifyFrontmatter(data, order) + (form.content || '')
    setSaving(true)
    try {
      await writeTextFile(postsDir, name, text)
      setCurrent(prev => ({ ...prev, isNew: false, name }))
      setDirty(false)
      setToast(`已保存 ${name}`)
      onSaved?.(dir)
    } catch (err) {
      setToast('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const insertImage = useCallback(async file => {
    if (!dir) { setToast('请先打开 content 目录'); return }
    try {
      const url = await copyImageTo(dir, file)
      const alt = decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '')
      const snippet = `![${alt}](${url})`
      const ta = textareaRef.current
      if (ta) {
        // Read the selection inside the updater so offsets and prev.content
        // are from the same render (safe under rapid consecutive inserts).
        setCurrent(prev => {
          const start = ta.selectionStart ?? prev.content.length
          const end = ta.selectionEnd ?? start
          const next = prev.content.slice(0, start) + snippet + prev.content.slice(end)
          return { ...prev, content: next }
        })
        setDirty(true)
        requestAnimationFrame(() => {
          ta.focus()
          const start = ta.selectionStart ?? ta.value.length
          ta.selectionStart = ta.selectionEnd = start + snippet.length
        })
      } else {
        setCurrent(prev => ({ ...prev, content: prev.content + '\n' + snippet }))
        setDirty(true)
      }
    } catch (err) {
      setToast('图片插入失败: ' + err.message)
    }
  }, [dir])

  // paste image -> insert into content
  useEffect(() => {
    if (!dir) return
    function onPaste(e) {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))
      if (!item) return
      e.preventDefault()
      const file = item.getAsFile()
      if (file) insertImage(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [dir, insertImage])

  return {
    current, dirty, saving, toast, textareaRef, setToast,
    onField, handleSelect, handleNew, handleImportMd, handleSave, insertImage,
  }
}
