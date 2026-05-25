import { Link } from 'react-router-dom'

export default function AdjacentNav({ prev, next }) {
  return (
    <nav className="adjacent-nav">
      {prev ? (
        <Link to={`/post/${prev.slug}`} className="nav-card">
          <div className="nav-card-label">← 上一篇</div>
          <div className="nav-card-title">{prev.title}</div>
        </Link>
      ) : <div className="adjacent-nav-spacer" />}
      {next ? (
        <Link to={`/post/${next.slug}`} className="nav-card">
          <div className="nav-card-label">下一篇 →</div>
          <div className="nav-card-title">{next.title}</div>
        </Link>
      ) : <div className="adjacent-nav-spacer" />}
    </nav>
  )
}
