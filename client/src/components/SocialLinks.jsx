export default function SocialLinks({ links, icons }) {
  const entries = Object.entries(links)
  if (entries.length === 0) return null
  return (
    <div className="social-links">
      {entries.map(([key, url]) => (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={key}>
          {icons[key] || '◎'}
        </a>
      ))}
    </div>
  )
}
