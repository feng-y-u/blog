import { Link } from 'react-router-dom'
import { formatDate } from '../utils/date'

export default function PostCard({ post, showExcerpt, showTags }) {
  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        {post.category && <span className="text-blue-600 font-medium">{post.category.name}</span>}
        <span>·</span>
        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
      </div>
      <Link to={`/post/${post.slug}`}>
        <h2 className="text-xl font-semibold mb-2 hover:text-blue-600">{post.title}</h2>
      </Link>
      {showExcerpt && post.excerpt && <p className="text-gray-600 dark:text-gray-400 text-sm">{post.excerpt}</p>}
      {showTags && post.tags?.length > 0 && (
        <div className="flex gap-2 mt-3">
          {post.tags.map(tag => (
            <span key={tag.id} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{tag.name}</span>
          ))}
        </div>
      )}
    </article>
  )
}
