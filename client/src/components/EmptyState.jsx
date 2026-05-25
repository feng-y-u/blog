export default function EmptyState({ icon, text, subtext }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-text">{text}</p>
      {subtext && <p className="empty-state-text" style={{ marginTop: '4px' }}>{subtext}</p>}
    </div>
  )
}
