import { Link } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

// Unified footer for all pages: copyright line + home link + source button.
export default function SiteFooter() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  const siteTitle = settings?.site_title || "风予's Blog"

  return (
    <footer className="site-footer">
      <div>&copy; {year} {siteTitle} | Powered by コードとアニメ</div>
      <div style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '6px' }}>图片来源于网络</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '10px' }}>
        <Link to="/" className="footer-btn">首页</Link>
        <a
          href="https://github.com/feng-y-u/blog"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-btn"
        >
          源码
        </a>
      </div>
    </footer>
  )
}
