import { Link } from 'react-router-dom'

export default function ArticleFooter({ tags, isFavorited, onToggleFavorite, onCopyLink, copied }) {
  return (
    <div className="article-footer">
      {tags?.length > 0 && (
        <div className="article-tags">
          {tags.map(tag => (
            <Link key={tag.slug} to={`/tag/${tag.slug}`} className="tag">
              {tag.name}
            </Link>
          ))}
        </div>
      )}
      <div className="article-actions">
        <button className="btn-ghost" onClick={onCopyLink}>
          {copied ? '已复制' : '复制链接'}
        </button>
        <button className="btn-ghost" onClick={onToggleFavorite}>
          {isFavorited ? '已收藏' : '收藏'}
        </button>
      </div>
    </div>
  )
}
