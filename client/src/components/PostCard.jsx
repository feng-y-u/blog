import { Link } from 'react-router-dom'

function readingTime(content) {
  if (!content) return ''
  const min = Math.ceil(content.length / 500)
  return min + ' min read'
}

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      {post.coverImage && (
        <div className="post-card-cover">
          <img src={post.coverImage} alt="" loading="lazy" />
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
          <Link to={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
        {(post.excerpt || post.content) && (
          <p className="post-card-excerpt">
            {post.excerpt || post.content.replace(/[#*`\[\]()>|\\]/g, '').slice(0, 120)}
          </p>
        )}
        {post.tags?.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 4).map(tag => (
              <span key={tag.id} className="tag" style={{ fontSize: '10px', padding: '2px 8px' }}>{tag.name}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
