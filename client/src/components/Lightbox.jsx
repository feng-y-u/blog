import { useEffect } from 'react'

export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <img src={src} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={e => e.stopPropagation()} alt="preview" />
    </div>
  )
}
