import { useState, useEffect } from 'react'
import { getTags } from '../api/tags'
import Loading from '../components/Loading'
import TagCloud from '../components/TagCloud'

export default function TagListPage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getTags()
      .then(res => { if (!cancelled) setTags(res.data.data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className="page-title">标签云</h1>
      <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginBottom: '16px' }}>
        共 {tags.length} 个标签
      </p>
      <div className="card" style={{ padding: '32px' }}>
        <TagCloud tags={tags} />
      </div>
    </div>
  )
}
