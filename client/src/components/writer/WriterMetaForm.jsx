import ArticleBody from '../ArticleBody'
import PostCard from '../PostCard'

// {slug,title,date,category,tags,coverImage,excerpt,jpChar,content} = form
export default function WriterMetaForm({ form, categories, tags, onField, onPickCover, coverInputRef }) {
  const inputStyle = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--fg)', fontSize: '13px', fontFamily: 'var(--font-body)' }
  const btn = { ...inputStyle, cursor: 'pointer', background: 'var(--surface)' }

  return (
    <div className="writer-meta">
      <div className="writer-field full">
        <label>标题</label>
        <input className="writer-input" value={form.title} onChange={e => onField('title', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>{form.isNew ? 'Slug（文件名主体）' : 'Slug（文件名，只读）'}</label>
        <input className="writer-input" value={form.slug} disabled={!form.isNew} onChange={e => onField('slug', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>日期（文件名前缀，新建时生效）</label>
        <input className="writer-input" type="date" value={form.date} disabled={!form.isNew} onChange={e => onField('date', e.target.value)} />
      </div>
      <div className="writer-field">
        <label>分类</label>
        <select className="writer-select" value={form.category} onChange={e => onField('category', e.target.value)}>
          <option value="">未分类</option>
          {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
          {form.category && !categories.some(c => c.name === form.category) && (
            <option value={form.category}>{form.category}（新建）</option>
          )}
        </select>
      </div>
      <div className="writer-field">
        <label>杂志装饰字（jpChar，可选）</label>
        <input className="writer-input" value={form.jpChar} onChange={e => onField('jpChar', e.target.value)} placeholder="如：博" />
      </div>
      <div className="writer-field full">
        <label>标签（点选切换，可输入新建）</label>
        <div className="writer-tags">
          {tags.map(t => (
            <button key={t.slug} type="button"
              className={`writer-tag${form.tags.includes(t.name) ? ' active' : ''}`}
              onClick={() => onField('tags', form.tags.includes(t.name) ? form.tags.filter(x => x !== t.name) : [...form.tags, t.name])}>
              {t.name}
            </button>
          ))}
          <input className="writer-input" style={{ width: 120 }} placeholder="新标签，回车添加"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const v = e.target.value.trim()
                if (v && !form.tags.includes(v)) onField('tags', [...form.tags, v])
                e.target.value = ''
              }
            }} />
        </div>
      </div>
      <div className="writer-field full">
        <label>封面</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={btn} onClick={() => coverInputRef.current?.click()}>选择封面图片</button>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickCover} />
          {form.coverImage && (
            <>
              <img src={form.coverImage} alt="封面预览" style={{ height: '48px', borderRadius: '6px', border: '1px solid var(--border)' }} />
              <button style={btn} onClick={() => onField('coverImage', '')}>移除</button>
            </>
          )}
        </div>
      </div>
      <div className="writer-field full">
        <label>摘要（留空则保存后由构建自动截取）</label>
        <textarea className="writer-textarea" rows={2} value={form.excerpt} onChange={e => onField('excerpt', e.target.value)} />
      </div>
      <div className="writer-field full">
        <label>正文预览（保存为 Markdown 文件）</label>
        <div className="article-body" style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', background: 'var(--bg)' }}>
          {form.content.trim() ? <ArticleBody content={form.content} onImageClick={() => {}} /> : <span style={{ color: 'var(--fg-muted)' }}>正文为空</span>}
        </div>
      </div>
      {form.isNew && (
        <div className="writer-field full">
          <label>文章卡片效果预览</label>
          <PostCard post={{
            slug: form.slug,
            title: form.title || '未命名文章',
            publishedAt: new Date(form.date + 'T00:00:00Z').toISOString(),
            category: form.category ? { name: form.category, slug: form.category } : null,
            tags: form.tags.map(t => ({ name: t, slug: t })),
            coverImage: form.coverImage || null,
            excerpt: form.excerpt || '',
            content: form.content,
          }} />
        </div>
      )}
    </div>
  )
}
