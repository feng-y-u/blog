import { Link } from 'react-router-dom'

export default function SiteFooter({ simple }) {
  const year = new Date().getFullYear()

  if (simple) {
    return (
      <footer className="site-footer">
        &copy; {year} 风予's Blog
      </footer>
    )
  }

  return (
    <footer className="site-footer">
      &copy; {year} 风予's Blog | Powered by コードとアニメ<br />
      <Link to="/" className="link-accent" style={{ margin: '0 4px' }}>首页</Link>
      {' · '}
      <a href="#" className="link-accent" style={{ margin: '0 4px' }}>关于</a>
      {' · '}
      <a href="#" className="link-accent" style={{ margin: '0 4px' }}>友情链接</a>
    </footer>
  )
}
