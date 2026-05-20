import { Helmet } from 'react-helmet-async'

export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <Helmet>
        <title>页面未找到 — Blog</title>
      </Helmet>
      <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--fg-muted)' }}>404</h1>
      <p style={{ color: 'var(--fg-secondary)' }}>页面不存在</p>
    </div>
  )
}
