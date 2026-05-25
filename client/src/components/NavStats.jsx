import { Link } from 'react-router-dom'

export default function NavStats({ stats, links }) {
  return (
    <div className="sidebar-card">
      <div className="section-title">导航</div>
      <div className="nav-stats">
        {links.map(({ to, label, key }) => (
          <Link key={key} to={to} className="nav-stat">
            <div className="nav-stat-num">{stats[key]}</div>
            <div className="nav-stat-label">{label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
