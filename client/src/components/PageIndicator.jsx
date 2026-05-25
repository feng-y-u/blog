export default function PageIndicator({ total, active, onNavigate }) {
  return (
    <div className="page-indicator">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className={`page-dot ${i === active ? 'page-dot-active' : ''}`}
          aria-label={`第 ${i + 1} 页`}
        />
      ))}
    </div>
  )
}
