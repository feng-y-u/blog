import { Helmet } from 'react-helmet-async'

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <Helmet>
        <title>页面未找到 — Blog</title>
      </Helmet>
      <h1 style={{ fontSize: '60px', fontWeight: 700, marginBottom: '16px', color: 'var(--fg-muted)' }}>404</h1>
      <p style={{ color: 'var(--fg-secondary)' }}>页面不存在</p>
    </div>
  )
}
