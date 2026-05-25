import { formatDate } from '../utils/date'

export default function ArticleMeta({ category, publishedAt, contentLength }) {
  return (
    <div className="article-meta">
      {category && (
        <>
          <span className="article-meta-category">{category.name}</span>
          <span className="article-meta-sep">/</span>
        </>
      )}
      <span className="article-meta-text">
        {formatDate(publishedAt)}
      </span>
      <span className="article-meta-sep">·</span>
      <span className="article-meta-text">
        约 {Math.max(1, Math.ceil((contentLength || 0) / 500))} 分钟
      </span>
    </div>
  )
}
