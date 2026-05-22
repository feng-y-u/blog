import { useState, useEffect, useRef } from 'react'
import client from '../api/client'
import { formatTime } from '../utils/date'

const AVATARS = ['🐱', '🦊', '🐧', '🐰', '🐻', '🐼', '🐨', '🦁']
const TEXTAREA_CSS = `
.comment-form textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
.comment-form input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
`

function randomAvatar(name) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATARS.length
  return AVATARS[idx]
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
        style={{
          width: '100%', minHeight: '100px', padding: '14px 16px',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          background: 'var(--bg)', color: 'var(--fg)', fontSize: '14px',
          fontFamily: 'var(--font-body)', resize: 'vertical', transition: 'var(--transition)',
        }} required />
      {!parentId && (
        <div className="flex items-center gap-3 mt-3">
          <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
            placeholder="昵称 *" required
            style={{
              flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)',
              transition: 'var(--transition)',
            }} />
          <input type="email" value={authorEmail} onChange={e => setAuthorEmail(e.target.value)}
            placeholder="邮箱（可选）"
            style={{
              flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)',
              transition: 'var(--transition)',
            }} />
        </div>
      )}
      {parentId && (
        <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)}
          placeholder="昵称 *" required
          style={{
            width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)',
            transition: 'var(--transition)', marginTop: '10px',
          }} />
      )}
      <div className="comment-form-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <span className="hint" style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{parentId ? '回复此评论' : '请保持友善，尊重他人'}</span>
        <button type="submit" disabled={submitting}
          className="comment-submit" style={{
            padding: '8px 24px', borderRadius: 'var(--radius-sm)', border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: '14px',
            fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
            transition: 'var(--transition)', opacity: submitting ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!submitting) { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.boxShadow = '0 0 16px var(--accent-glow)' } }}
          onMouseLeave={e => { e.currentTarget.style.opacity = submitting ? '0.5' : '1'; e.currentTarget.style.boxShadow = 'none' }}>
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
      <div className="comment-item" style={{
        display: 'flex', gap: '14px', padding: '16px 0',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="comment-avatar" style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: 'var(--bg)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>
          {randomAvatar(comment.authorName)}
        </div>
        <div className="comment-body" style={{ flex: 1, minWidth: 0 }}>
          <div className="comment-author" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fg)' }}>
            {comment.authorName}
            <span className="comment-date" style={{ fontSize: '12px', color: 'var(--fg-muted)', marginLeft: '8px', fontWeight: 400 }}>{formatTime(comment.createdAt)}</span>
          </div>
          <p className="comment-text" style={{
            fontSize: '14px', color: 'var(--fg-secondary)', marginTop: '6px', lineHeight: 1.6,
          }}>{comment.content}</p>
          <button onClick={() => setShowReply(!showReply)}
            className="comment-reply" style={{
              fontSize: '12px', color: 'var(--accent)', textDecoration: 'none',
              marginTop: '6px', display: 'inline-block', cursor: 'pointer',
              border: 'none', background: 'none', fontFamily: 'var(--font-body)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {showReply ? '取消回复' : '回复'}
          </button>
        </div>
      </div>
      {showReply && (
        <div style={{ marginLeft: '50px', marginTop: '10px', marginBottom: '8px' }}>
          <CommentForm postId={postId} parentId={comment.id} onSubmit={handleReply} placeholder={`回复 ${comment.authorName}...`} buttonText="回复" />
        </div>
      )}
      {replies.length > 0 && (
        <div style={{ marginLeft: '50px' }}>
          {replies.map(reply => (
            <div key={reply.id} className="comment-item" style={{
              display: 'flex', gap: '14px', padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div className="comment-avatar" style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px',
              }}>
                {randomAvatar(reply.authorName)}
              </div>
              <div className="comment-body" style={{ flex: 1, minWidth: 0 }}>
                <div className="comment-author" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>
                  {reply.authorName}
                  <span className="comment-date" style={{ fontSize: '11px', color: 'var(--fg-muted)', marginLeft: '8px', fontWeight: 400 }}>{formatTime(reply.createdAt)}</span>
                </div>
                <p className="comment-text" style={{
                  fontSize: '13px', color: 'var(--fg-secondary)', marginTop: '4px', lineHeight: 1.6,
                }}>{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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

  if (loading) return <div className="text-center py-8" style={{ fontSize: '14px', color: 'var(--fg-muted)' }}>加载评论中...</div>

  return (
    <>
      <style>{TEXTAREA_CSS}</style>
      <h3 className="comments-title" style={{
        fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '20px',
      }}>
        评论 <span style={{ color: 'var(--fg-secondary)', fontSize: '14px', fontWeight: 400 }}>· {comments.length} 条</span>
      </h3>

      <CommentForm postId={postId} onSubmit={handleSubmit} />

      {error && <p style={{ color: 'var(--accent)', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

      {comments.length > 0 && (
        <div className="comment-list" style={{ marginTop: '24px' }}>
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} onReply={handleReply} />
          ))}
        </div>
      )}

      {comments.length === 0 && !error && (
        <p className="text-center" style={{ fontSize: '14px', color: 'var(--fg-muted)', marginTop: '24px', padding: '16px 0' }}>暂无评论，来说点什么吧</p>
      )}
    </>
  )
}
