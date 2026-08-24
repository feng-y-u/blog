import { useCallback } from 'react'
import ArticleBody from '../ArticleBody'
import useResolvedUrl from './useResolvedUrl'

// Renders one markdown image, resolving /images/... against the connected
// content dir so fresh images show in the preview in any environment.
function PreviewImage({ dir, src, alt, onClick }) {
  const resolved = useResolvedUrl(dir, src)
  return <img src={resolved} alt={alt || ''} loading="lazy" onClick={onClick} />
}

export default function WriterPreview({ form, width, dir }) {
  const renderImg = useCallback(
    props => <PreviewImage dir={dir} {...props} onClick={() => {}} />,
    [dir],
  )
  return (
    <div className="writer-preview" style={width ? { width } : undefined}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', margin: '0 0 12px' }}>正文预览</h2>
      <div className="article-body">
        {form.content.trim() ? <ArticleBody content={form.content} imgRenderer={renderImg} /> : <span style={{ color: 'var(--fg-muted)' }}>正文为空，开始写作吧</span>}
      </div>
    </div>
  )
}