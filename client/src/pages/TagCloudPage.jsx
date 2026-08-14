import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTags } from '../api/tags'
import Loading from '../components/Loading'

export default function TagCloudPage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTags().then(res => setTags(res.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const maxCount = Math.max(...tags.map(t => t._count?.posts || 0), 1)

  return (
    <div>
      <h1 className="page-title">标签云</h1>
      <div className="card" style={{ padding: '32px' }}>
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
      </div>
      {tags.length === 0 && <p className="loading">暂无标签</p>}
    </div>
  )
}
