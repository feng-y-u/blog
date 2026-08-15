import ArticleBody from '../ArticleBody'

export default function WriterPreview({ form }) {
  return (
    <div className="writer-preview">
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: '0 0 12px' }}>正文预览</h2>
      <div className="article-body">
        {form.content.trim() ? <ArticleBody content={form.content} onImageClick={() => {}} /> : <span style={{ color: 'var(--fg-muted)' }}>正文为空，开始写作吧</span>}
      </div>
    </div>
  )
}
