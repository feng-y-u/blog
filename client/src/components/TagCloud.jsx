import { Link } from 'react-router-dom'

export default function TagCloud({ tags }) {
  if (!tags || tags.length === 0) {
    return <p style={{ color: 'var(--fg-secondary)' }}>暂无标签</p>
  }

  const maxCount = Math.max(...tags.map(t => t._count?.posts || 0), 1)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
      {tags.map(tag => {
        const count = tag._count?.posts || 0
        const weight = count / maxCount
        const size = 12 + weight * 16
        const opacity = 0.5 + weight * 0.5
        return (
          <Link
            key={tag.slug}
            to={`/tag/${tag.slug}`}
            className="tag"
            style={{
              fontSize: `clamp(12px, ${size}px, 28px)`,
              opacity,
              transition: 'var(--transition)',
            }}
          >
            {tag.name}
            <span style={{ fontSize: '11px', color: 'var(--fg-muted)', marginLeft: '4px' }}>({count})</span>
          </Link>
        )
      })}
    </div>
  )
}
