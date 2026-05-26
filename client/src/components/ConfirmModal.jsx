import { useEffect } from 'react'

export default function ConfirmModal({ open, title, message, confirmText, cancelText, onConfirm, onCancel, danger }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-title">{title || '确认操作'}</div>
        <div className="confirm-message">{message || '确定继续吗？'}</div>
        <div className="confirm-actions">
          <button onClick={onCancel} className="admin-btn">{cancelText || '取消'}</button>
          <button onClick={onConfirm} className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`}>
            {confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
