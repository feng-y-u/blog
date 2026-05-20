import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getPostBySlug } from '../api/posts'
import Loading from '../components/Loading'
import { formatDate } from '../utils/date'

export default function PostDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getPostBySlug(slug)
      .then(res => setPost(res.data.data))
      .catch(err => setError(err.response?.data?.error || '文章不存在'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <Loading />
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>
  if (!post) return null

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 mb-4 inline-block">← 返回首页</Link>

      <div className="mb-2">
        {post.category && <span className="text-sm text-blue-600 font-medium">{post.category.name}</span>}
      </div>
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-8">
        <span>{post.author?.displayName || '作者'}</span>
        <span>·</span>
        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
        <span>·</span>
        <span>阅读 {post.viewCount}</span>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {post.tags?.length > 0 && (
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500">标签：</span>
          {post.tags.map(tag => (
            <Link key={tag.id} to={`/tag/${tag.slug}`} className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-blue-100">{tag.name}</Link>
          ))}
        </div>
      )}
    </article>
  )
}
