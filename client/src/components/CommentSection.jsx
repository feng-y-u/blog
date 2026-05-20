import { useState, useEffect, useRef } from 'react'
import client from '../api/client'

function Avatar({ name }) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500',
  ]
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return (
    <div className={`w-9 h-9 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function CommentForm({ postId, parentId, onSubmit, placeholder, buttonText }) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  function autoResize() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!authorName.trim() || !content.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({ authorName: authorName.trim(), authorEmail: authorEmail.trim() || undefined, content: content.trim(), parentId })
      setContent('')
      if (!parentId) {
        setAuthorName('')
        setAuthorEmail('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea ref={textareaRef} value={content} onChange={e => { setContent(e.target.value); autoResize() }}
        placeholder={placeholder || '写下你的评论...'}
        className="w-full min-h-[100px] p-3.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm resize-y focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-colors" required />
      {!parentId && (
        <div className="flex items-center gap-3 mt-3">
          <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="昵称 *" required
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-400" />
          <input type="email" value={authorEmail} onChange={e => setAuthorEmail(e.target.value)}
            placeholder="邮箱（可选）"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-400" />
        </div>
      )}
      {parentId && (
        <div className="mt-3">
          <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="昵称 *" required
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:border-blue-400" />
        </div>
      )}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-400">{parentId ? '回复此评论' : '评论将等待管理员审核'}</span>
        <button type="submit" disabled={submitting}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:opacity-85 disabled:opacity-50 transition-all">
          {submitting ? '提交中...' : (buttonText || '发表评论')}
        </button>
      </div>
    </form>
  )
}

function CommentItem({ comment, postId, onReply }) {
  const [showReply, setShowReply] = useState(false)
  const [replies, setReplies] = useState(comment.replies || [])

  function handleReply(data) {
    return onReply(data).then(newComment => {
      setReplies(prev => [...prev, newComment])
      setShowReply(false)
    })
  }

  return (
    <div>
      <div className="flex gap-3.5 py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
        <Avatar name={comment.authorName} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {comment.authorName}
            <span className="text-xs font-normal text-gray-400 ml-2">{formatTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{comment.content}</p>
          <button onClick={() => setShowReply(!showReply)}
            className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 inline-block transition-colors">
            {showReply ? '取消回复' : '回复'}
          </button>
        </div>
      </div>
      {showReply && (
        <div className="ml-12 mt-3 mb-2">
          <CommentForm postId={postId} parentId={comment.id} onSubmit={handleReply} placeholder={`回复 ${comment.authorName}...`} buttonText="回复" />
        </div>
      )}
      {replies.length > 0 && (
        <div className="ml-12">
          {replies.map(reply => (
            <div key={reply.id} className="flex gap-3.5 py-3 border-b border-gray-100 dark:border-gray-700/30 last:border-b-0">
              <Avatar name={reply.authorName} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {reply.authorName}
                  <span className="text-xs font-normal text-gray-400 ml-2">{formatTime(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function fetchComments() {
    return client.get(`/posts/${postId}/comments`)
      .then(res => setComments(res.data.data))
      .catch(() => setError('加载评论失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchComments() }, [postId])

  async function handleCreate(data) {
    const res = await client.post(`/posts/${postId}/comments`, data)
    return res.data.data
  }

  async function handleSubmit(data) {
    try {
      await handleCreate(data)
      setComments(prev => [...prev, { ...data, id: Date.now(), replies: [], createdAt: new Date().toISOString(), status: 'pending' }])
    } catch (err) {
      alert(err.message)
    }
  }

  const handleReply = handleCreate

  if (loading) return <div className="text-center py-8 text-sm text-gray-400">加载评论中...</div>

  return (
    <div className="mt-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
      <h3 className="text-lg font-bold mb-5">
        评论
        <span className="text-sm font-normal text-gray-400 ml-2">（{comments.length} 条）</span>
      </h3>

      <CommentForm postId={postId} onSubmit={handleSubmit} />

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      {comments.length > 0 && (
        <div className="mt-6">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} onReply={handleReply} />
          ))}
        </div>
      )}

      {comments.length === 0 && !error && (
        <p className="text-center text-sm text-gray-400 mt-6 py-4">暂无评论，来说点什么吧</p>
      )}
    </div>
  )
}
