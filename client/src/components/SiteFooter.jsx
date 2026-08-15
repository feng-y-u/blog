import { Link } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

export default function SiteFooter({ simple }) {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  const siteTitle = settings?.site_title || "风予's Blog"

  if (simple) {
    return (
      <footer className="site-footer">
        &copy; {year} {siteTitle}
      </footer>
    )
  }

  return (
    <footer className="site-footer">
      &copy; {year} {siteTitle} | Powered by コードとアニメ<br />
      <Link to="/" className="link-accent" style={{ margin: '0 4px' }}>首页</Link>
    </footer>
  )
}
