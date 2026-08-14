import { useState, useEffect } from 'react'

export default function AdminToast({ message, onClose, type }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 2000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="admin-toast" data-type={type || 'success'} data-visible={visible}>
      {message}
    </div>
  )
}
