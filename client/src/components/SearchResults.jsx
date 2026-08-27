import { Link } from 'react-router-dom'
import EmptyState from './EmptyState'
import Loading from './Loading'

function highlightText(text, keyword) {
  if (!keyword) return text
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i}>{part}</mark>
      : part
  )
}

function readingTime(content) {
  if (!content) return ''
  const min = Math.ceil(content.length / 500)
  return min + ' min read'
}

export default function SearchResults({ results, keyword, loading }) {
  if (loading) {
    return <Loading />
  }

  if (!results || results.length === 0) {
    return (
      <EmptyState
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        text="没有找到匹配的文章"
        subtext="试试其他关键词或分类"
      />
    )
  }

  return (
    <div>
      <p className="search-result-count">找到 {results.length} 条结果</p>
      <div className="search-results">
        {results.map(post => (
          <article key={post.slug} className="post-card">
            {post.coverImage && (
              <div className="post-card-cover">
                <img src={post.coverImage} alt="" loading="lazy" style={post.coverPosition ? { objectPosition: post.coverPosition } : undefined} />
              </div>
            )}
            <div className="post-card-body">
              <div className="post-card-meta">
                {post.category && <span className="post-card-category">{post.category.name}</span>}
                <span>·</span>
                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                })}</span>
                <span>·</span>
                <span>{readingTime(post.content)}</span>
              </div>
              <h2 className="post-card-title">
                <Link to={`/post/${post.slug}`}>
                  {highlightText(post.title, keyword)}
                </Link>
              </h2>
              {(post.excerpt || post.content) && (
                <p className="post-card-excerpt">
                  {highlightText(
                    post.excerpt || post.content.replace(/[#*`\[\]()>|\\]/g, '').slice(0, 120),
                    keyword
                  )}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
